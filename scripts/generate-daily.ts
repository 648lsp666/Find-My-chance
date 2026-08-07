#!/usr/bin/env tsx
/**
 * Daily opportunity generator.
 * Fetches real signals from HN / GitHub / Product Hunt / 36kr / IndieHackers,
 * then calls OpenAI Responses API to produce a structured JSON file.
 *
 * Usage:
 *   npm run generate              # skip if today's file exists
 *   npm run generate:force        # overwrite today's file
 *
 * Required env:  OPENAI_API_KEY
 * Optional env:  OPENAI_MODEL, PRODUCT_HUNT_TOKEN, GITHUB_TOKEN,
 *                FORCE_GENERATE, DRY_RUN
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { get as httpsGet } from 'https'
import { requestOpenAIJson } from './openai-generation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  source: string
  title: string
  url: string
  description?: string
  score?: number
}

const opportunitySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    category: { type: 'string' },
    market: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    description: { type: 'string' },
    painPoint: { type: 'string' },
    stage: { type: 'string' },
    targetCustomer: { type: 'string' },
    reachChannel: { type: 'string' },
    facts: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    validationWindow: { type: 'string' },
    validationBudget: { type: 'string' },
    validationPlan: { type: 'array', items: { type: 'string' } },
    successCriteria: { type: 'string' },
    stopCondition: { type: 'string' },
    pricingHypothesis: { type: 'string' },
    risks: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'integer' },
    difficulty: { type: 'integer' },
    evidence: { type: 'string' },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' }, url: { type: 'string' } },
        required: ['title', 'url'],
      },
    },
  },
  required: [
    'id', 'title', 'category', 'market', 'tags', 'summary', 'description',
    'painPoint', 'stage', 'targetCustomer', 'reachChannel', 'facts',
    'assumptions', 'validationWindow', 'validationBudget', 'validationPlan',
    'successCriteria', 'stopCondition', 'pricingHypothesis', 'risks',
    'confidence', 'difficulty', 'evidence', 'sources',
  ],
}

const dailySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string' },
    generatedAt: { type: 'string' },
    summary: { type: 'string' },
    opportunities: { type: 'array', items: opportunitySchema },
  },
  required: ['date', 'generatedAt', 'summary', 'opportunities'],
}

const opportunityArraySchema = { type: 'array', items: opportunitySchema }

const trendingAnnotationSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      insight: { type: 'string' },
      opportunityType: { type: 'string', enum: ['就业', '产品', '学习', '趋势'] },
      chinaFit: { type: 'string', enum: ['high', 'medium', 'low'] },
    },
    required: ['owner', 'repo', 'insight', 'opportunityType', 'chinaFit'],
  },
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
  model: string,
  draft: any[],
  historyContext: string,
): Promise<any[] | null> {
  const historySection = historyContext
    ? `\n近14天历史机会（用于去重判断）：\n${historyContext}\n`
    : ''

  const qualityPrompt = `你是极其保守的商业机会质检员。宁可一条不留，也不能把技术热度包装成付费需求。${historySection}
今日候选假设（${draft.length}条）：
${JSON.stringify(draft, null, 2)}

任务：
1. 删除与历史 category+主题重复度 > 70% 的条目
2. 删除只有点赞、star、榜单热度，却无法支持付费需求的条目
3. 删除找不到明确付费者或无法触达前 10 个潜在客户的条目
4. 删除个人无法在 7 天内做出验证物、48-72 小时内无法获得真实反馈的条目
5. 删除依赖大规模平台、双边市场、企业私有数据、未开放 API、牌照或高风险爬虫的条目
6. facts 只能写信号直接证明的事实，assumptions 必须明确为待验证推测
7. successCriteria 必须包含可计数的真实承诺，stopCondition 必须能让人果断停止
8. 最多保留 3 条；没有合格条目时返回 []
9. 只返回最终数组 JSON，不要有任何其他文字`

  try {
    const result = await requestOpenAIJson<any[]>({
      apiKey,
      model,
      prompt: qualityPrompt,
      schemaName: 'quality_checked_opportunities',
      schema: opportunityArraySchema,
    })
    if (!Array.isArray(result)) {
      console.warn('  ⚠ Pass 2 did not return an array')
      return null
    }
    return result.slice(0, 3)
  } catch (err: any) {
    console.warn(`  ⚠ Pass 2 failed: ${err?.message ?? err}`)
    return null
  }
}

async function annotateTrending(apiKey: string, model: string, repos: any[]): Promise<any[] | null> {
  if (repos.length === 0) return null

  const repoList = repos.map((r: any, i: number) =>
    `[T${i + 1}] ${r.owner}/${r.repo}${r.description ? ': ' + r.description : ''} | ★${r.starsToday} | ${r.language || '未知'}`
  ).join('\n')

  const annotatePrompt = `以下是今日 GitHub 热门仓库：

${repoList}

请为每个仓库提供面向中国独立开发者的简短机会解读。只返回 JSON 数组，不要有任何其他文字：

[
  {
    "owner": "仓库owner",
    "repo": "仓库名",
    "insight": "25字以内中文：这个仓库对独立开发者意味着什么机会",
    "opportunityType": "产品",
    "chinaFit": "high"
  }
]

opportunityType 必须是以下之一：就业、产品、学习、趋势
chinaFit 必须是以下之一：high、medium、low`

  try {
    const result = await requestOpenAIJson<any[]>({
      apiKey,
      model,
      prompt: annotatePrompt,
      schemaName: 'trending_annotations',
      schema: trendingAnnotationSchema,
      maxOutputTokens: 2048,
    })
    return Array.isArray(result) ? result : null
  } catch (err: any) {
    console.warn(`  ⚠ Trending annotation failed: ${err?.message ?? err}`)
    return null
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')
  const model = process.env.OPENAI_MODEL ?? 'gpt-5.6-terra'

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

请基于以上真实信号，筛选 0-3 个值得中国独立开发者进一步验证的商业假设。宁缺毋滥；没有合格候选时 opportunities 必须返回空数组。

**严格要求：**
1. 每个机会必须由上面某条信号触发，sources[].url 必须直接使用上面列表中的真实 URL（不允许使用主页 URL）
2. 当前内容只能称为“待验证假设”，不得声称需求、收入或回收周期已经成立
3. 面向 1 人验证：7 天内能做出验证物，48-72 小时内能接触真实潜在客户，验证预算不超过 500 元
4. category 只能从以下选择：AI应用、SaaS工具、开发工具、数据服务、自动化流程、企业服务、教育培训、出海产品、自媒体、整活玩具、本地服务、内容创作
5. ${historyContext ? 'category 相同且主题高度相似的机会不得重复出现（参考近14天历史）' : '避免生成过于相似的机会'}
6. 热度只能证明“有人关注”，不能证明“有人付费”；facts 与 evidence 不得越过信号能支持的范围
7. 必须写明明确付费者、触达前 10 位潜客的具体渠道、一票否决风险、成功标准和停止条件
8. pricingHypothesis 只能给出待测试的价格及计算依据，禁止预估月收入
9. 禁止先开发完整产品；validationPlan 必须以访谈、落地页、手工服务、样品或预售为主
10. 所有文本字段中禁止使用 [数字] 格式引用信号编号，直接用文字描述内容

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
      "summary": "一句话描述要验证的商业假设（25字以内）",
      "description": "说明信号与商业假设之间的推理，同时明确目前尚未证明什么（80-150字）",
      "painPoint": "假设中的核心用户痛点（一句话）",
      "stage": "待验证",
      "targetCustomer": "具体到可识别、可联系的首批付费者",
      "reachChannel": "找到并联系前10位潜在客户的具体地点或方法",
      "facts": ["信号直接证明的事实，不做外推"],
      "assumptions": ["必须通过行动验证的关键推测"],
      "validationWindow": "48小时",
      "validationBudget": "≤500元",
      "validationPlan": [
        "制作最小验证物，不开发完整产品",
        "联系10位具体潜在客户",
        "提出明确价格并索取真实承诺"
      ],
      "successCriteria": "量化的继续标准，例如10人中3人愿意付99元订金",
      "stopCondition": "量化的停止标准，例如联系20人仍无人愿意访谈或付费",
      "pricingHypothesis": "待测试价格及起始依据，不包含月收入预测",
      "risks": ["最大的一票否决风险"],
      "confidence": 3,
      "difficulty": 3,
      "evidence": "引用信号中的具体事实，并明确它只支持关注度还是确有购买意向",
      "sources": [
        { "title": "信号来源描述", "url": "必须是上面信号列表中的真实 URL" }
      ]
    }
  ]
}`

  // ── Call OpenAI ───────────────────────────────────────────────────────────
  console.log(`Calling OpenAI Responses API (${model})…`)
  const data: any = await requestOpenAIJson({
    apiKey,
    model,
    prompt,
    schemaName: 'daily_opportunities',
    schema: dailySchema,
  })

  // Strip citation-style [number] references from text fields (e.g. "Signal[55]" artifacts)
  const stripCitations = (text: string) => text.replace(/\s*\[\d+\]/g, '')
  if (Array.isArray(data.opportunities)) {
    data.opportunities = data.opportunities.map((opp: any) => ({
      ...opp,
      stage: '待验证',
      path: Array.isArray(opp.validationPlan) ? opp.validationPlan : [],
      revenueModel: opp.pricingHypothesis ?? '价格尚未验证',
      timeToRevenue: opp.validationWindow ?? '48–72小时',
      startupCost: opp.validationBudget ?? '≤500元',
      potential: Math.max(2, Math.min(10, Number(opp.confidence ?? 1) * 2)),
      competition: '未知，待验证',
      description: opp.description ? stripCitations(opp.description) : opp.description,
      evidence: opp.evidence ? stripCitations(opp.evidence) : opp.evidence,
      painPoint: opp.painPoint ? stripCitations(opp.painPoint) : opp.painPoint,
      summary: opp.summary ? stripCitations(opp.summary) : opp.summary,
    }))
  }

  if (!Array.isArray(data.opportunities)) {
    throw new Error('Response missing opportunities array')
  }
  data.opportunities = data.opportunities.slice(0, 3)

  // ── Pass 2: quality check ─────────────────────────────────────────────────
  console.log('Running quality check (Pass 2)…')
  const checkedOpportunities = data.opportunities.length > 0
    ? await runQualityCheck(apiKey, model, data.opportunities, historyContext)
    : []

  if (checkedOpportunities !== null) {
    console.log(`  ✓ Pass 2: ${data.opportunities.length} → ${checkedOpportunities.length} opportunities`)
    data.opportunities = checkedOpportunities.map((opp: any) => ({
      ...opp,
      stage: '待验证',
      path: Array.isArray(opp.validationPlan) ? opp.validationPlan : [],
      revenueModel: opp.pricingHypothesis ?? '价格尚未验证',
      timeToRevenue: opp.validationWindow ?? '48–72小时',
      startupCost: opp.validationBudget ?? '≤500元',
      potential: Math.max(2, Math.min(10, Number(opp.confidence ?? 1) * 2)),
      competition: '未知，待验证',
    }))
  } else {
    console.warn('  ⚠ Pass 2 failed, using Pass 1 output')
  }

  // ── Pass 3: annotate trending repos ──────────────────────────────────────
  if (trendingRepos.length > 0) {
    console.log('Annotating trending repos (Pass 3)…')
    const annotations = await annotateTrending(apiKey, model, trendingRepos)
    if (annotations && annotations.length > 0) {
      console.log(`  ✓ Pass 3: annotated ${annotations.length} repos`)
      data.trending = trendingRepos.map((repo: any) => {
        const ann = annotations.find((a: any) => a.repo === repo.repo && a.owner === repo.owner)
        return ann ? { ...repo, insight: ann.insight, opportunityType: ann.opportunityType, chinaFit: ann.chinaFit } : repo
      })
    } else {
      console.warn('  ⚠ Pass 3 failed, using raw trending data')
      data.trending = trendingRepos
    }
  }

  // ── Write output ─────────────────────────────────────────────────────────
  if (process.env.DRY_RUN === '1') {
    console.log(`✓ Dry run complete: ${data.opportunities.length} opportunities; no file written`)
    return
  }
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`✓ Wrote ${data.opportunities.length} opportunities → ${outPath}`)
}

main().catch(err => {
  console.error('✗', err.message ?? err)
  process.exit(1)
})
