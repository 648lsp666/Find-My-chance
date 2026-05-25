#!/usr/bin/env tsx
/**
 * Daily opportunity generator.
 * Fetches real signals from HN / GitHub / Product Hunt / 36kr,
 * then calls Claude API to produce a structured JSON file.
 *
 * Usage:
 *   npm run generate              # skip if today's file exists
 *   npm run generate:force        # overwrite today's file
 *
 * Required env:  ANTHROPIC_API_KEY
 * Optional env:  PRODUCT_HUNT_TOKEN, GITHUB_TOKEN, FORCE_GENERATE
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  source: string
  title: string
  url: string
  description?: string
  score?: number
}

// ─── Signal fetchers ─────────────────────────────────────────────────────────

async function fetchHNSignals(): Promise<Signal[]> {
  const since = Math.floor((Date.now() - 86_400_000) / 1000)
  const url =
    `https://hn.algolia.com/api/v1/search?tags=(show_hn,front_page)` +
    `&numericFilters=created_at_i>${since}&hitsPerPage=15`
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

async function fetchGitHubSignals(): Promise<Signal[]> {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch(
    `https://api.github.com/search/repositories?q=pushed:>${since}+stars:500..50000+fork:false&sort=stars&order=desc&per_page=10`,
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

async function fetchPHSignals(): Promise<Signal[]> {
  const token = process.env.PRODUCT_HUNT_TOKEN
  if (!token) return []
  const postedAfter = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10) + 'T00:00:00Z'
  const query = `{
    posts(order: VOTES, postedAfter: "${postedAfter}", first: 10) {
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
  if (!res.ok) throw new Error(`PH API ${res.status}`)
  const data: any = await res.json()
  return (data.data?.posts?.edges ?? []).map((e: any) => ({
    source: 'Product Hunt',
    title: `${e.node.name}: ${e.node.tagline}`,
    url: e.node.url,
    description: e.node.tagline,
    score: e.node.votesCount,
  }))
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

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required')

  const client = new Anthropic({ apiKey })

  const date = new Date()
    .toLocaleString('sv', { timeZone: 'Asia/Shanghai' })
    .slice(0, 10)

  const outDir = join(process.cwd(), 'data', 'opportunities')
  const outPath = join(outDir, `${date}.json`)

  if (existsSync(outPath) && !process.env.FORCE_GENERATE) {
    console.log(`✓ Already generated for ${date} (set FORCE_GENERATE=1 to overwrite)`)
    process.exit(0)
  }

  // ── Fetch signals ────────────────────────────────────────────────────────
  console.log(`Fetching signals for ${date}…`)

  const results = await Promise.allSettled([
    fetchHNSignals(),
    fetchGitHubSignals(),
    fetchPHSignals(),
    fetch36krSignals(),
  ])

  results.forEach((r, i) => {
    const name = ['HN', 'GitHub', 'Product Hunt', '36kr'][i]
    if (r.status === 'rejected') console.warn(`  ⚠ ${name}: ${r.reason}`)
    else console.log(`  ✓ ${name}: ${r.value.length} signals`)
  })

  const signals: Signal[] = results.flatMap(r =>
    r.status === 'fulfilled' ? r.value : [],
  )

  if (signals.length < 5) {
    throw new Error(`Only ${signals.length} signals collected — too few for quality output`)
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

  const prompt = `今天是 ${date}。以下是从各平台实时抓取的技术与市场信号（共 ${signals.length} 条，含真实 URL）：

${signalBlock}

---

请基于以上真实信号，为中国独立开发者/个人创业者挖掘 6-8 个可落地的副业机会。

**严格要求：**
1. 每个机会必须由上面某条信号触发，sources[].url 必须直接使用上面列表中的真实 URL（不允许使用主页 URL）
2. 面向 1 人独立执行，3 个月内可见收益，启动成本可控
3. 优先考虑国内市场可行性（也可做海外向）
4. category 只能从以下选择：AI应用、SaaS工具、自媒体、整活玩具、本地服务、内容创作

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
      "sources": [
        { "title": "信号来源描述", "url": "必须是上面信号列表中的真实 URL" }
      ]
    }
  ]
}`

  // ── Call Claude ───────────────────────────────────────────────────────────
  console.log('Calling Claude API…')
  const msg = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''

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

  // ── Write output ─────────────────────────────────────────────────────────
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`✓ Wrote ${data.opportunities.length} opportunities → ${outPath}`)
}

main().catch(err => {
  console.error('✗', err.message ?? err)
  process.exit(1)
})
