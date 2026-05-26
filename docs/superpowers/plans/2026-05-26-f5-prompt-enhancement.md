# F5 CCR Prompt Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `generate-daily.ts` to add IndieHackers as a signal source, inject 14-day dedup history into Pass 1 prompt, require evidence citations, and add a Pass 2 quality-check LLM call that filters to 6-8 final opportunities.

**Architecture:** Single file modification to `scripts/generate-daily.ts`. Three new functions added: `fetchIHSignals()` (RSS fetcher), `loadRecentHistory()` (reads last 14 JSON files), `runQualityCheck()` (second LLM call). Pass 1 prompt gains dedup context block and `evidence` field. Pass 2 filters result to 6-8 items; any failure gracefully falls back to Pass 1 output.

**Tech Stack:** TypeScript, tsx, DeepSeek V4 Flash API (`deepseek-v4-flash`), Node.js `fs` module

---

### Task 1: Add IndieHackers fetcher

**Files:**
- Modify: `scripts/generate-daily.ts`

- [ ] **Step 1: Add `fetchIHSignals` function**

In `scripts/generate-daily.ts`, add the following function immediately after `fetch36krSignals`:

```typescript
async function fetchIHSignals(): Promise<Signal[]> {
  // ihrss.io is a community-maintained unofficial RSS mirror of IndieHackers
  const res = await fetch('https://ihrss.io/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpRadar/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`IndieHackers RSS ${res.status}`)
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
    const desc =
      chunk.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]?.slice(0, 200) ?? ''
    if (title && url) items.push({ source: 'IndieHackers', title, url, description: desc })
  }
  return items
}
```

- [ ] **Step 2: Wire into `Promise.allSettled` in `main()`**

Find the existing `Promise.allSettled` call and add `fetchIHSignals()`:

```typescript
const [trendingResult, ...signalResults] = await Promise.allSettled([
  fetchTrendingRepos(),
  fetchHNSignals(),
  fetchGitHubSignals(),
  fetchPHSignals(),
  fetch36krSignals(),
  fetchIHSignals(),
])
```

Update the logging name array on the next few lines:

```typescript
const name = ['HN', 'GitHub', 'Product Hunt', '36kr', 'IndieHackers'][i]
```

- [ ] **Step 3: Verify ihrss.io is reachable**

Run this quick check to confirm the RSS URL and format:

```bash
curl -s -A "Mozilla/5.0 (compatible; OpRadar/1.0)" "https://ihrss.io/" | head -60
```

Expected: XML output with `<channel>` and `<item>` blocks. If you see HTML or 404, try `https://ihrss.io/feed.xml` instead and update the URL in the function.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-daily.ts
git commit -m "feat: add IndieHackers signal source via ihrss.io RSS"
```

---

### Task 2: Load 14-day history for dedup context

**Files:**
- Modify: `scripts/generate-daily.ts`

- [ ] **Step 1: Add `readdirSync` and `readFileSync` to the fs import**

Find the existing import at the top of the file:

```typescript
import { writeFileSync, existsSync, mkdirSync } from 'fs'
```

Replace with:

```typescript
import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs'
```

- [ ] **Step 2: Add `loadRecentHistory` function**

Add this function immediately before `async function main()`:

```typescript
function loadRecentHistory(outDir: string, days: number = 14): string {
  const entries: string[] = []
  try {
    const files = readdirSync(outDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .slice(-days)
    for (const file of files) {
      const raw = JSON.parse(readFileSync(join(outDir, file), 'utf-8'))
      for (const opp of raw.opportunities ?? []) {
        if (opp.title && opp.category) {
          entries.push(`- [${opp.category}] ${opp.title}`)
        }
      }
    }
  } catch {
    // outDir may not exist on first run, or files may be malformed — safe to ignore
  }
  return entries.join('\n')
}
```

- [ ] **Step 3: Call `loadRecentHistory` in `main()` before building the prompt**

In `main()`, find the line `// ── Build prompt` and add the call just before it:

```typescript
const historyContext = loadRecentHistory(outDir)
if (historyContext) {
  console.log(`  ✓ Loaded dedup history: ${historyContext.split('\n').length} recent opportunities`)
} else {
  console.log('  ℹ No history found (first run or empty dir)')
}

// ── Build prompt ─────────────────────────────────────────────────────────
```

- [ ] **Step 4: Verify history loading**

```bash
cd /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar
npx tsx -e "
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

function loadRecentHistory(outDir, days = 14) {
  const entries = []
  try {
    const files = readdirSync(outDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json\$/.test(f))
      .sort()
      .slice(-days)
    for (const file of files) {
      const raw = JSON.parse(readFileSync(join(outDir, file), 'utf-8'))
      for (const opp of (raw.opportunities ?? [])) {
        if (opp.title && opp.category) entries.push('[' + opp.category + '] ' + opp.title)
      }
    }
  } catch {}
  return entries.join('\n')
}

const result = loadRecentHistory('data/opportunities')
console.log('Lines:', result.split('\n').filter(Boolean).length)
console.log(result.slice(0, 400))
"
```

Expected: prints lines like `[AI应用] xxx机会标题`, count matches number of opportunities in recent JSON files.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-daily.ts
git commit -m "feat: load 14-day opportunity history for dedup context"
```

---

### Task 3: Update Pass 1 prompt (dedup context + evidence field)

**Files:**
- Modify: `scripts/generate-daily.ts` (the `prompt` template string in `main()`)

- [ ] **Step 1: Build the dedup section variable**

In `main()`, immediately before the `const prompt = \`...\`` line, add:

```typescript
const dedupeSection = historyContext
  ? `\n【近14天已生成的机会（避免重复）】\n${historyContext}\n`
  : ''
```

- [ ] **Step 2: Replace the entire `prompt` template string**

Find the `const prompt = \`今天是 ${date}。...` block and replace it entirely with:

```typescript
const prompt = `今天是 ${date}。以下是从各平台实时抓取的技术与市场信号（共 ${signals.length} 条，含真实 URL）：

${signalBlock}
${dedupeSection}
---

请基于以上真实信号，为中国独立开发者/个人创业者挖掘 8-10 个可落地的副业机会。

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
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-daily.ts
git commit -m "feat: update Pass 1 prompt with dedup context and evidence field"
```

---

### Task 4: Add Pass 2 quality check

**Files:**
- Modify: `scripts/generate-daily.ts`

- [ ] **Step 1: Add `runQualityCheck` function**

Add this function immediately before `async function main()`:

```typescript
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
3. 删除被标记的条目，从剩余中保留质量最高的 6-8 条
4. 只返回最终机会数组的 JSON，格式：[{ ...opportunity对象 }]，不要有任何其他文字`

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      max_tokens: 8192,
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

  try {
    const result = JSON.parse(stripped.slice(start, end + 1))
    if (!Array.isArray(result) || result.length === 0) {
      console.warn('  ⚠ Pass 2 returned empty array')
      return null
    }
    return result
  } catch {
    console.warn('  ⚠ Pass 2 failed: JSON parse error')
    return null
  }
}
```

- [ ] **Step 2: Call `runQualityCheck` in `main()` after Pass 1 parsing**

Find this existing block in `main()`:

```typescript
if (!Array.isArray(data.opportunities) || data.opportunities.length === 0) {
  throw new Error('Response missing opportunities array')
}
```

Add the Pass 2 call immediately after it:

```typescript
// ── Pass 2: quality check ─────────────────────────────────────────────────
console.log('Running quality check (Pass 2)…')
const checkedOpportunities = await runQualityCheck(apiKey, data.opportunities, historyContext)

if (checkedOpportunities && checkedOpportunities.length >= 6) {
  console.log(`  ✓ Pass 2: ${data.opportunities.length} → ${checkedOpportunities.length} opportunities`)
  data.opportunities = checkedOpportunities
} else if (checkedOpportunities && checkedOpportunities.length < 6) {
  console.warn(`  ⚠ Pass 2 filtered too aggressively (${checkedOpportunities.length} left), using Pass 1`)
} else {
  console.warn('  ⚠ Pass 2 failed, using Pass 1 output')
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-daily.ts
git commit -m "feat: add Pass 2 quality check LLM call with fallback"
```

---

### Task 5: End-to-end test and push

- [ ] **Step 1: Run full script locally**

```bash
cd /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar
FORCE_GENERATE=1 DEEPSEEK_API_KEY=<your-key> npm run generate
```

Expected output (order may vary):
```
Fetching signals for 2026-05-26…
  ✓ Trending repos: 6
  ✓ HN: N signals
  ✓ GitHub: N signals
  ✓ Product Hunt: N signals
  ✓ 36kr: N signals
  ✓ IndieHackers: N signals
  ✓ Loaded dedup history: N recent opportunities
Calling DeepSeek API…
Running quality check (Pass 2)…
  ✓ Pass 2: 9 → 7 opportunities
✓ Wrote 7 opportunities → data/opportunities/2026-05-26.json
```

- [ ] **Step 2: Spot-check output quality**

Open `data/opportunities/2026-05-26.json` and verify:
- Each opportunity has an `evidence` field with a specific number or case reference (not "市场需求旺盛")
- No two opportunities in the same `category` share nearly identical themes
- All `sources[].url` are real article URLs (not `github.com`, `36kr.com`, `producthunt.com` homepages)
- Total opportunities: 6-8

- [ ] **Step 3: Push to remote**

```bash
git push
```

Vercel auto-deploys on push. Check `opradar.indevs.in` loads correctly and shows today's opportunities.
