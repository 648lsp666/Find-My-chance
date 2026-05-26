# 词云功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 DailyBrief 卡片内嵌入纯 CSS 词云，聚合当日机会 tags 频次，点击可过滤 OpportunityList。

**Architecture:** 新建 `DailyContent` client wrapper 持有 `selectedTag` state，将 `DailyBrief` 和 `OpportunityList` 包在其中，让 server component `[date]/page.tsx` 保持 SSG 兼容。`DailyBrief` 新增词云区块，`OpportunityList` 新增 tag 过滤层（独立于现有 category/time filter）。

**Tech Stack:** Next.js 14 App Router, React useState/useMemo, Tailwind CSS, TypeScript

---

## File Map

| 操作 | 文件 | 说明 |
|------|------|------|
| Create | `components/DailyContent.tsx` | client wrapper，持有 selectedTag state |
| Modify | `components/DailyBrief.tsx` | 新增词云区块 + 新 props |
| Modify | `components/OpportunityList.tsx` | 新增 selectedTag prop + tag 过滤 |
| Modify | `app/[date]/page.tsx` | 用 DailyContent 替换 DailyBrief + OpportunityList |

---

## Task 1: 给 OpportunityList 加 selectedTag 过滤

**Files:**
- Modify: `components/OpportunityList.tsx`

- [ ] **Step 1: 更新 Props 接口，加入 selectedTag**

  在 `components/OpportunityList.tsx` 的 `interface Props` 里加一个字段：

  ```tsx
  interface Props {
    opportunities: Opportunity[]
    date: string
    selectedTag: string | null   // ← 新增
  }
  ```

- [ ] **Step 2: 更新函数签名**

  ```tsx
  export default function OpportunityList({ opportunities, date, selectedTag }: Props) {
  ```

- [ ] **Step 3: 在 filtered useMemo 里叠加 tag 过滤**

  原来的 `filtered` 计算如下（`components/OpportunityList.tsx:62-71`），在 `return` 表达式里加一个 `matchTag` 条件：

  ```tsx
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return opportunities.filter(o => {
      const matchCat  = activeCats.length === 0 || activeCats.includes(o.category)
      const matchTime = activeTime === 'all' || getTimeBucket(o.timeToRevenue) === activeTime
      const matchText = !q || [o.title, o.summary, o.description, o.painPoint, ...o.tags, o.revenueModel]
        .some(t => t.toLowerCase().includes(q))
      const matchTag  = !selectedTag || o.tags.includes(selectedTag)   // ← 新增
      return matchCat && matchTime && matchText && matchTag
    })
  }, [opportunities, search, activeCats, activeTime, selectedTag])     // ← 加 selectedTag 依赖
  ```

- [ ] **Step 4: 验证类型通过**

  ```bash
  cd /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错（`selectedTag` 此时调用方还没传，会报 missing prop — 正常，Task 4 里修复）

---

## Task 2: 改造 DailyBrief，嵌入词云

**Files:**
- Modify: `components/DailyBrief.tsx`

- [ ] **Step 1: 更新 Props 接口**

  完整替换文件顶部的 `interface Props`：

  ```tsx
  import type { Opportunity } from '@/lib/opportunities'

  interface Props {
    date: string
    summary: string
    count: number
    opportunities: Opportunity[]
    selectedTag: string | null
    onTagSelect: (tag: string) => void
  }
  ```

- [ ] **Step 2: 更新函数签名**

  ```tsx
  export default function DailyBrief({ date, summary, count, opportunities, selectedTag, onTagSelect }: Props) {
  ```

- [ ] **Step 3: 加 import，并在模块级（组件函数之外）声明常量和工具函数**

  在 `'use client'` 下方加 import：

  ```tsx
  import { useMemo } from 'react'
  import type { Opportunity } from '@/lib/opportunities'
  ```

  在组件函数**之外**（文件顶部、import 之后）加：

  ```tsx
  const STAGGER = [0, 14, 4, 20, 8, 16, 2, 22, 10, 6, 18, 12, 24, 0, 14]

  function tagStyle(count: number): { fontSize: number; fontWeight: number; color: string } {
    if (count >= 4) return { fontSize: 27, fontWeight: 800, color: '#7C3AED' }
    if (count === 3) return { fontSize: 19, fontWeight: 700, color: '#5B21B6' }
    if (count === 2) return { fontSize: 13, fontWeight: 400, color: '#6D28D9' }
    return { fontSize: 10, fontWeight: 400, color: '#C4B5FD' }
  }
  ```

  在组件函数内（`if (!summary) return null` 之前）加 useMemo：

  ```tsx
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const opp of opportunities) {
      for (const tag of opp.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
  }, [opportunities])
  ```

- [ ] **Step 4: 在 `<p>{summary}</p>` 后面加词云区块**

  紧接在 `</p>` 和 `</div>` 之间插入：

  ```tsx
  {tagCounts.length > 0 && (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="font-mono text-[9px] text-white/40 tracking-[0.2em] uppercase mb-3">
        今日热词 · 点击过滤，再次点击取消
      </p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-0">
        {tagCounts.map(([tag, count], i) => {
          const { fontSize, fontWeight, color } = tagStyle(count)
          const isSelected = selectedTag === tag
          return (
            <span
              key={tag}
              onClick={() => onTagSelect(tag)}
              style={{
                fontSize,
                fontWeight,
                color: isSelected ? '#fff' : color,
                marginTop: STAGGER[i % STAGGER.length],
                textDecoration: isSelected ? 'underline' : 'none',
                opacity: selectedTag && !isSelected ? 0.35 : 1,
                cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'opacity 0.15s, color 0.15s',
                userSelect: 'none',
              }}
            >
              {tag}<sup style={{ fontSize: fontSize * 0.4, color: '#A78BFA', marginLeft: 1 }}>{count}</sup>
            </span>
          )
        })}
      </div>
    </div>
  )}
  ```

- [ ] **Step 5: 验证类型**

  ```bash
  npx tsc --noEmit --skipLibCheck
  ```

  预期：仍有 missing prop 报错（调用方还没更新），但 DailyBrief 内部无报错

---

## Task 3: 新建 DailyContent wrapper

**Files:**
- Create: `components/DailyContent.tsx`

- [ ] **Step 1: 创建文件**

  ```tsx
  'use client'

  import { useState } from 'react'
  import type { DayData } from '@/lib/opportunities'
  import DailyBrief from './DailyBrief'
  import OpportunityList from './OpportunityList'

  interface Props {
    data: DayData
    date: string
  }

  export default function DailyContent({ data, date }: Props) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    const handleTagSelect = (tag: string) => {
      setSelectedTag(prev => prev === tag ? null : tag)
    }

    return (
      <>
        <DailyBrief
          date={data.date}
          summary={data.summary ?? ''}
          count={data.opportunities.length}
          opportunities={data.opportunities}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
        />
        <OpportunityList
          opportunities={data.opportunities}
          date={date}
          selectedTag={selectedTag}
        />
      </>
    )
  }
  ```

- [ ] **Step 2: 验证类型通过**

  ```bash
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错

---

## Task 4: 更新 [date]/page.tsx 使用 DailyContent

**Files:**
- Modify: `app/[date]/page.tsx`

- [ ] **Step 1: 替换 import**

  删除：
  ```tsx
  import DailyBrief from '@/components/DailyBrief'
  import OpportunityList from '@/components/OpportunityList'
  ```
  
  新增：
  ```tsx
  import DailyContent from '@/components/DailyContent'
  ```

- [ ] **Step 2: 替换 JSX**

  删除原来的两个组件调用（`app/[date]/page.tsx:57-80`）：
  ```tsx
  {/* Daily brief */}
  <DailyBrief
    date={data.date}
    summary={data.summary ?? ''}
    count={data.opportunities.length}
  />
  ...
  {/* Filter + cards */}
  <OpportunityList opportunities={data.opportunities} date={params.date} />
  ```

  替换为：
  ```tsx
  {/* Daily brief + word cloud + opportunity list */}
  <DailyContent data={data} date={params.date} />
  ```

  > 注意：`SharePdfButtons` 和 section header `<div>` 保持不变，仅替换 DailyBrief 和 OpportunityList 这两处。

- [ ] **Step 3: 验证类型全部通过**

  ```bash
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错

---

## Task 5: 本地验证 & 提交

- [ ] **Step 1: 启动开发服务器**

  ```bash
  npm run dev
  ```

- [ ] **Step 2: 验证词云渲染**

  打开 `http://localhost:3000`，检查：
  - DailyBrief 卡片底部出现「今日热词」区块
  - 词语大小反映频次（出现多次的词更大更深）
  - 词语有垂直错落感（不是整齐一行）
  - 上标数字显示正确

- [ ] **Step 3: 验证过滤交互**

  - 点击词云中某个词 → 下方机会列表只显示含该 tag 的机会
  - 该词变为白色+下划线，其他词变透明
  - 再次点击同一个词 → 恢复全部显示
  - 点击其他词 → 切换过滤目标
  - category/time filter 与 tag filter 互不干扰（可叠加）

- [ ] **Step 4: 验证移动端**

  浏览器缩窄到 375px，词云应自然换行，不溢出卡片

- [ ] **Step 5: 提交**

  ```bash
  git add components/DailyContent.tsx components/DailyBrief.tsx components/OpportunityList.tsx app/[date]/page.tsx
  git commit -m "feat: add tag word cloud to DailyBrief with opportunity filtering"
  ```
