#!/usr/bin/env tsx
/**
 * Daily opportunity generator.
 * Fetches real signals from HN / GitHub / Product Hunt / 36kr / IndieHackers,
 * then calls DeepSeek API to produce a structured JSON file.
 *
 * Usage:
 *   npm run generate              # skip if today's file exists
 *   npm run generate:force        # overwrite today's file
 *
 * Required env:  DEEPSEEK_API_KEY
 * Optional env:  PRODUCT_HUNT_TOKEN, GITHUB_TOKEN, FORCE_GENERATE
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { get as httpsGet } from 'https'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  source: string
  title: string
  url: string
  description?: string
  score?: number
}

// ─── Signal fetchers ─────────────────────────────────────────────────────────

async function fetchTrendingRepos() {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(
    `https://api.github.com/search/repositories?q=pushed:>${since}+stars:500..50000+fork:false&sort=stars&order=desc&per_page=6`,
    { headers },
  )
  if (!res.ok) throw new Error(`GitHub trending ${res.status}`)
  const data: any = await res.json()
  return (data.items ?? []).map((r: any) => ({
    owner:       r.owner?.login ?? '',
    repo:        r.name         ?? '',
    description: r.description  ?? '',
    url:         r.html_url     ?? '',
    starsToday:  r.stargazers_count ?? 0,
    language:    r.language     ?? '',
  }))
}

async function fetchHNSignals(dateStr?: string): Promise<Signal[]> {
  let sinceTs: number
  if (dateStr) {
    sinceTs = Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 1000)
  } else {
    sinceTs = Math.floor((Date.now() - 86_400_000) / 1000)
  }
  const untilTs = dateStr
    ? Math.floor(new Date(dateStr + 'T23:59:59Z').getTime() / 1000)
    : Math.floor(Date.now() / 1000)

  const url =
    `https://hn.algolia.com/api/v1/search?tags=(show_hn,front_page)` +
    `&numericFilters=created_at_i>${sinceTs},created_at_i<${untilTs}&hitsPerPage=25`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HN API ${res.status}`)
  const data: any = await res.json()
  return (data.hits ?? [])
    .filter((h: any) => h.url)
    .map((h: any) => ({
      source: 'Hacker News',
      title: h.title,
      url: h.url,
      description: h.story_text?.slice(0, 200),
      score: h.points,
    }))
}

async function fetchGitHubSignals(dateStr?: string): Promise<Signal[]> {
  const since = dateStr
    ? new Date(new Date(dateStr).getTime() - 2 * 86_400_000).toISOString().slice(0, 10)
    : new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch(
    `https://api.github.com/search/repositories?q=pushed:>${since}+stars:500..50000+fork:false&sort=stars&order=desc&per_page=20`,
    { headers },
  )
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data: any = await res.json()
  return (data.items ?? []).map((r: any) => ({
    source: 'GitHub',
    title: `${r.full_name}${r.description ? ': ' + r.description : ''}`,
    url: r.html_url,
    description: r.description,
    score: r.stargazers_count,
  }))
}

async function fetchPHSignals(dateStr?: string): Promise<Signal[]> {
  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token) return []

  const postedAfter = dateStr
    ? dateStr + 'T00:00:00Z'
    : new Date(Date.now() - 86_400_000).toISOString().slice(0, 10) + 'T00:00:00Z'
  const postedBefore = dateStr ? dateStr + 'T23:59:59Z' : undefined
  const postedBeforeArg = postedBefore ? `, postedBefore: "${postedBefore}"` : ''
  const query = `{
    posts(order: VOTES, postedAfter: "${postedAfter}"${postedBeforeArg}, first: 15) {
      edges { node { name tagline url votesCount } }
    }
  }`
  const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`PH API ${res.status}: ${body.slice(0, 200)}`)
  }
  const data: any = await res.json()
  return (data.data?.posts?.edges ?? []).map((e: any) => ({
    source: 'Product Hunt',
    title: `${e.node.name}: ${e.node.tagline}`,
    url: e.node.url,
    description: e.node.tagline,
    score: e.node.votesCount,
  }))
}

async function fetchIHSignals(): Promise<Signal[]> {
  // DEV.to is a major cross-posting hub for IndieHackers — querying the
  // `indiehackers` tag surfaces genuine indie-hacker signals daily.
  // The DEV.to API is public and needs no auth key.
  const res = await fetch(
    'https://dev.to/api/articles?tag=indiehackers&per_page=15&top=3',
    {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpRadar/1.0)' },
      signal: AbortSignal.timeout(8000),
    },
  )
  if (!res.ok) throw new Error(`IndieHackers (DEV.to) ${res.status}`)
  const data: any[] = await res.json()
  return data
    .filter((a: any) => a.url && a.title)
    .slice(0, 15)
    .map((a: any) => ({
      source: 'IndieHackers',
      title: a.title,
      url: a.url,
      description: a.description?.slice(0, 200),
      score: a.public_reactions_count ?? 0,
    }))
}

function httpsGetJson(url: string, timeoutMs = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = httpsGet(url, { headers: { 'User-Agent': 'curl/8.4.0' } }, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) } catch (e) { reject(e) }
      })
    })
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('timeout')) })
    req.on('error', reject)
  })
}

async function fetchV2EXSignals(): Promise<Signal[]> {
  const data: any[] = await httpsGetJson('https://www.v2ex.com/api/topics/hot.json')
  return data
    .filter((t: any) => t.url && t.title)
    .slice(0, 15)
    .map((t: any) => ({
      source: 'V2EX',
      title: t.title,
      url: t.url,
      description: t.content?.slice(0, 200),
      score: t.replies ?? 0,
    }))
}

async function fetchSSPAISignals(): Promise<Signal[]> {
  const res = await fetch('https://sspai.com/feed', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpRadar/1.0)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`SSPAI RSS ${res.status}`)
  const xml = await res.text()
  const items: Signal[] = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && items.length < 15) {
    const chunk = m[1]
    const title =
      chunk.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      chunk.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const url =
      chunk.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1] ??
      chunk.match(/<guid>(https?:\/\/[^<]+)<\/guid>/)?.[1] ?? ''
    const desc =
      chunk.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
        ?.replace(/<[^>]+>/g, '')
        .slice(0, 200) ?? ''
    if (title && url) items.push({ source: '少数派', title, url, description: desc })
  }
  return items
}

async function fetch36krSignals(): Promise<Signal[]> {
  const res = await fetch('https://36kr.com/feed', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpRadar/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`36kr RSS ${res.status}`)
  const xml = await res.text()
  const items: Signal[] = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && items.length < 10) {
    const chunk = m[1]
    const title =
      chunk.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      chunk.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const url =
      chunk.match(/<link>(https?:\/\/[^<]+)<\/link>/)?.[1] ??
      chunk.match(/<guid>(https?:\/\/[^<]+)<\/guid>/)?.[1] ?? ''
    if (title && url) items.push({ source: '36kr', title, url })
  }
  return items
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function loadRecentHistory(outDir: string, days: number = 14): string {
  const entries: string[] = []
  try {
    const files = readdirSync(outDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .slice(-days)
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(outDir, file), 'utf-8'))
        for (const opp of data.opportunities ?? []) {
          if (opp.title && opp.category) {
            entries.push(`- [${opp.category}] ${opp.title}`)
          }
        }
      } catch {
        // skip malformed files
      }
    }
  } catch {
    // outDir may not exist on first run, or files may be malformed — safe to ignore
  }
  return entries.join('\n')
}

async function runQualityCheck(
  apiKey: string,
  draft: any[],
  historyContext: string,
): Promise<any[] | null> {
  const historySection = historyContext
    ? `\n近14天历史机会（用于去重判断）：\n${historyContext}\n`
    : ''

  const qualityPrompt = `你是内容质检员。${historySection}
今日草稿机会（${draft.length}条）：
${JSON.stringify(draft, null, 2)}

任务：
1. 标记与历史 category+主题重复度 > 70% 的条目
2. 标记 evidence 字段模糊（无具体数字或案例）的条目
3. 删除被标记的条目，从剩余中保留质量最高的 10-12 条
4. 只返回最终机会数组的 JSON，格式：[{ ...opportunity对象 }]，不要有任何其他文字`

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        max_tokens: 16384,
        messages: [{ role: 'user', content: qualityPrompt }],
      }),
    })

    if (!res.ok) {
      console.warn(`  ⚠ Pass 2 API error ${res.status}`)
      return null
    }

    const json: any = await res.json()
    const raw: string = json.choices?.[0]?.message?.content ?? ''
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const start = stripped.indexOf('[')
    const end = stripped.lastIndexOf(']')
    if (start === -1 || end === -1) {
      console.warn('  ⚠ Pass 2 failed: no JSON array in response')
      return null
    }

    const result = JSON.parse(stripped.slice(start, end + 1))
    if (!Array.isArray(result) || result.length === 0) {
      console.warn('  ⚠ Pass 2 returned empty array')
      return null
    }
    return result
  } catch (err: any) {
    console.warn(`  ⚠ Pass 2 failed: ${err?.message ?? err}`)
    return null
  }
}

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required')

  const date = process.env.BACKFILL_DATE
    ?? new Date().toLocaleString('sv', { timeZone: 'Asia/Shanghai' }).slice(0, 10)

  const outDir = join(process.cwd(), 'data', 'opportunities')
  const outPath = join(outDir, `${date}.json`)

  if (existsSync(outPath) && !process.env.FORCE_GENERATE) {
    console.log(`✓ Already generated for ${date} (set FORCE_GENERATE=1 to overwrite)`)
    process.exit(0)
  }

  // ── Fetch signals ────────────────────────────────────────────────────────
  console.log(`Fetching signals for ${date}…`)

  const targetDate = process.env.TARGET_DATE || undefined

  const [trendingResult, ...signalResults] = await Promise.allSettled([
    fetchTrendingRepos(),
    fetchHNSignals(targetDate),
    fetchGitHubSignals(targetDate),
    fetchPHSignals(targetDate),
    fetch36krSignals(),
    fetchIHSignals(),
    fetchV2EXSignals(),
    fetchSSPAISignals(),
  ])
  const results = signalResults

  const trendingRepos = trendingResult.status === 'fulfilled' ? trendingResult.value : []
  if (trendingResult.status === 'rejected') console.warn(`  ⚠ Trending: ${trendingResult.reason}`)
  else console.log(`  ✓ Trending repos: ${trendingRepos.length}`)

  results.forEach((r, i) => {
    const name = ['HN', 'GitHub', 'Product Hunt', '36kr', 'IndieHackers', 'V2EX', '少数派'][i]
    if (r.status === 'rejected') console.warn(`  ⚠ ${name}: ${r.reason}`)
    else console.log(`  ✓ ${name}: ${r.value.length} signals`)
  })

  const signals: Signal[] = results.flatMap(r =>
    r.status === 'fulfilled' ? r.value : [],
  )

  if (signals.length < 5) {
    throw new Error(`Only ${signals.length} signals collected — too few for quality output`)
  }

  const historyContext = loadRecentHistory(outDir)
  if (historyContext) {
    console.log(`  ✓ Loaded dedup history: ${historyContext.split('\n').length} recent opportunities`)
  } else {
    console.log('  ℹ No history found (first run or empty dir)')
  }

  // ── Build prompt ─────────────────────────────────────────────────────────
  const signalBlock = signals
    .map((s, i) =>
      [
        `[${i + 1}] [${s.source}] ${s.title}`,
        s.score !== undefined ? `    分值/热度: ${s.score}` : '',
        s.description ? `    简介: ${s.description.slice(0, 150)}` : '',
        `    URL: ${s.url}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n')

  const dedupeSection = historyContext
    ? `\n【近14天已生成的机会（避免重复）】\n${historyContext}\n`
    : ''

  const prompt = `今天是 ${date}。以下是从 HN、GitHub、Product Hunt、36kr、IndieHackers、V2EX、少数派等平台实时抓取的技术与市场信号（共 ${signals.length} 条，含真实 URL）：

${signalBlock}
${dedupeSection}
---

请基于以上真实信号，为中国独立开发者/个人创业者挖掘 12-15 个可落地的副业机会。

**严格要求：**
1. 每个机会必须由上面某条信号触发，sources[].url 必须直接使用上面列表中的真实 URL（不允许使用主页 URL）
2. 面向 1 人独立执行，3 个月内可见收益，启动成本可控
3. 优先考虑国内市场可行性（也可做海外向）
4. category 只能从以下选择：AI应用、SaaS工具、自媒体、整活玩具、本地服务、内容创作
5. ${historyContext ? 'category 相同且主题高度相似的机会不得重复出现（参考近14天历史）' : '避免生成过于相似的机会'}
6. evidence 必须引用上方信号列表中的真实数据（具体数字、用户量、涨幅等），不允许使用模糊表达如"市场需求旺盛"

只返回如下格式的 JSON，不要有任何其他文字或 markdown 代码块：

{
  "date": "${date}",
  "generatedAt": "${new Date().toISOString()}",
  "summary": "今日整体信号摘要，描述主要趋势，2-3 句话",
  "opportunities": [
    {
      "id": 1,
      "title": "机会标题（10字以内，有冲击力）",
      "category": "AI应用",
      "market": "国内为主",
      "tags": ["标签1", "标签2", "标签3"],
      "summary": "一句话概括核心机会（25字以内）",
      "description": "详细分析，包含市场规模估算、竞品现状、差异化切入点（100-200字）",
      "painPoint": "核心用户痛点（一句话）",
      "path": [
        "第一步：具体动作",
        "第二步：具体动作",
        "第三步：具体动作",
        "第四步：具体动作"
      ],
      "revenueModel": "具体收费模式和预估月收入",
      "timeToRevenue": "X个月",
      "startupCost": "< XXX元",
      "difficulty": 3,
      "potential": 7,
      "competition": "低",
      "evidence": "直接引用信号中的具体数字或案例，例如：'该 GitHub 仓库 3 天内获得 2400 star，说明开发者对此类工具需求强烈'",
      "sources": [
        { "title": "信号来源描述", "url": "必须是上面信号列表中的真实 URL" }
      ]
    }
  ]
}`

  // ── Call DeepSeek ─────────────────────────────────────────────────────────
  console.log('Calling DeepSeek API…')
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      max_tokens: 16384,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API ${res.status}: ${err}`)
  }
  const json: any = await res.json()
  const finishReason = json.choices?.[0]?.finish_reason
  if (finishReason === 'length') {
    throw new Error('DeepSeek response truncated (finish_reason=length) — output too long')
  }
  const raw: string = json.choices?.[0]?.message?.content ?? ''

  // Strip optional ```json fences if model added them
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  const jsonStart = stripped.indexOf('{')
  const jsonEnd = stripped.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON found in response:\n${raw.slice(0, 500)}`)
  }

  const data = JSON.parse(stripped.slice(jsonStart, jsonEnd + 1))

  if (!Array.isArray(data.opportunities) || data.opportunities.length === 0) {
    throw new Error('Response missing opportunities array')
  }

  // ── Pass 2: quality check ─────────────────────────────────────────────────
  console.log('Running quality check (Pass 2)…')
  const checkedOpportunities = await runQualityCheck(apiKey, data.opportunities, historyContext)

  if (checkedOpportunities && checkedOpportunities.length >= 8) {
    console.log(`  ✓ Pass 2: ${data.opportunities.length} → ${checkedOpportunities.length} opportunities`)
    data.opportunities = checkedOpportunities
  } else if (checkedOpportunities && checkedOpportunities.length < 8) {
    console.warn(`  ⚠ Pass 2 filtered too aggressively (${checkedOpportunities.length} left), using Pass 1`)
  } else {
    console.warn('  ⚠ Pass 2 failed, using Pass 1 output')
  }

  // ── Write output ─────────────────────────────────────────────────────────
  if (trendingRepos.length > 0) data.trending = trendingRepos
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`✓ Wrote ${data.opportunities.length} opportunities → ${outPath}`)
}

main().catch(err => {
  console.error('✗', err.message ?? err)
  process.exit(1)
})
