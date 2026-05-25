# 每日机会雷达 UI 全面重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将页面从极深暗色主题重设计为亮白紫色现代主题，新增变现周期筛选，提升字号与交互反馈质量。

**Architecture:** 纯前端改动，7个文件，无后端改动。先更新 Tailwind 色值 token（其他组件自动继承），再逐组件重写视觉结构。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS v3, React 18

---

## File Map

| 文件 | 改动 |
|---|---|
| `tailwind.config.ts` | 更新 `r.*` 色值，新增 `r.time` |
| `app/globals.css` | 更新 body 背景，移除白点阵 pattern，更新 card-lift hover 阴影 |
| `components/Header.tsx` | 白底毛玻璃 header，紫色渐变图标 |
| `components/DateNav.tsx` | 改为标签页样式，白底 + 下划线激活态 |
| `components/OpportunityList.tsx` | 新增 `getTimeBucket` 函数 + 变现周期筛选行，重写 chip 样式 |
| `components/OpportunityCard.tsx` | 新增彩色渐变卡头，字号上调，更新色值引用 |
| `app/[date]/page.tsx` | 简报改为紫色渐变横幅，main 改为 `max-w-4xl` |

---

## Task 1: 更新 Tailwind 色值 Token

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: 替换色值配置**

将 `tailwind.config.ts` 中 `colors.r` 全部替换为新亮色方案，并新增 `time` token：

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['"DM Sans"', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
      },
      colors: {
        r: {
          bg:     '#F5F4FF',
          card:   '#FFFFFF',
          border: '#E5E3F5',
          dim:    '#C4B5FD',
          muted:  '#6B7280',
          faint:  '#9CA3AF',
          text:   '#1E1B4B',
          accent: '#7C3AED',
          time:   '#0D9488',
        },
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: 验证 TypeScript 编译无报错**

```bash
cd /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar
npm run build 2>&1 | tail -20
```

Expected: 构建成功，无 TypeScript 报错（样式变化在浏览器中验证）

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: switch to light purple color theme tokens"
```

---

## Task 2: 更新全局 CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: 替换 globals.css 全部内容**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }

  body {
    background-color: #F5F4FF;
    color: #1E1B4B;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background: rgba(124, 58, 237, 0.2);
    color: #1E1B4B;
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .card-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .card-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(124, 58, 237, 0.12);
    border-color: #C4B5FD !important;
  }

  .fade-in {
    animation: fadeIn 0.35s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}
```

关键变化：body 背景 `#F5F4FF`，移除白色点阵 pattern（亮色背景下不可见且产生视觉噪音），card-lift hover 阴影改为紫色。

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: update global bg and card-lift hover to purple shadow"
```

---

## Task 3: 重写 Header 组件

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: 替换 Header.tsx 全部内容**

```tsx
'use client'

import { useEffect, useState } from 'react'
import SubscribeForm from './SubscribeForm'

export default function Header() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-r-border bg-white/95 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base leading-none"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}
          >
            ⌖
          </div>
          <div>
            <div className="font-mono text-[9px] text-r-accent tracking-[0.3em] uppercase leading-none mb-0.5">
              Daily Intelligence
            </div>
            <div className="font-display font-bold text-[17px] text-r-text leading-none tracking-tight">
              每日机会雷达
            </div>
          </div>
        </div>

        {/* Right: subscribe + clock */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <SubscribeForm />
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-mono text-[9px] text-r-muted tracking-[0.2em] uppercase leading-none mb-1">
              CST · AI Powered
            </div>
            <div className="font-mono text-sm text-r-accent tabular-nums font-semibold">
              {time || '──:──:──'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: 验证编译**

```bash
npm run build 2>&1 | tail -10
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "style: redesign header with light theme and gradient brand icon"
```

---

## Task 4: 重写 DateNav 为标签页样式

**Files:**
- Modify: `components/DateNav.tsx`

- [ ] **Step 1: 替换 DateNav.tsx 全部内容**

```tsx
'use client'

import Link from 'next/link'

interface Props {
  dates: string[]
  currentDate: string
}

export default function DateNav({ dates, currentDate }: Props) {
  return (
    <div className="bg-white border-b border-r-border">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex overflow-x-auto no-scrollbar">
          {dates.slice(0, 20).map((date, i) => {
            const [, m, d] = date.split('-')
            const active = date === currentDate
            const isLatest = i === 0
            return (
              <Link
                key={date}
                href={`/${date}`}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-3 border-b-2 transition-all duration-200 ${
                  active
                    ? 'border-r-accent text-r-accent'
                    : 'border-transparent text-r-muted hover:text-r-accent hover:bg-r-bg'
                }`}
              >
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase opacity-70">
                  {isLatest ? 'Today' : `${m}月`}
                </span>
                <span className="font-mono font-bold text-[20px] leading-none tabular-nums">
                  {d}
                </span>
                {isLatest && active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-r-accent mt-0.5" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/DateNav.tsx
git commit -m "style: redesign date nav as tab bar with underline active state"
```

---

## Task 5: 重写 OpportunityList，新增变现周期筛选

**Files:**
- Modify: `components/OpportunityList.tsx`

- [ ] **Step 1: 替换 OpportunityList.tsx 全部内容**

新增 `TimeBucket` 类型和 `getTimeBucket` 解析函数，新增变现周期筛选行，重写 chip 样式（圆角全填充 active 态）：

```tsx
'use client'

import { useState, useMemo } from 'react'
import type { Opportunity } from '@/lib/opportunities'
import OpportunityCard from './OpportunityCard'

const ALL_CATS = ['AI应用', '自媒体', 'SaaS工具', '整活玩具', '本地服务', '内容创作', '其他']

const CAT_COLORS: Record<string, string> = {
  'AI应用':   '#7C3AED',
  '自媒体':   '#8B5CF6',
  'SaaS工具': '#059669',
  '整活玩具': '#DC2626',
  '本地服务': '#D97706',
  '内容创作': '#EA580C',
  '其他':     '#6B7280',
}

type TimeBucket = '1mo' | '1-3mo' | '3mo+'
type TimeFilter = 'all' | TimeBucket

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all',    label: '不限' },
  { value: '1mo',   label: '⚡ 1个月内' },
  { value: '1-3mo', label: '🚀 1-3个月' },
  { value: '3mo+',  label: '📈 3个月+' },
]

function getTimeBucket(timeToRevenue: string): TimeBucket {
  if (timeToRevenue.includes('周')) return '1mo'
  const nums = (timeToRevenue.match(/\d+/g) ?? []).map(Number)
  if (nums.length === 0) return '1-3mo'
  const max = Math.max(...nums)
  if (max <= 1) return '1mo'
  if (max <= 3) return '1-3mo'
  return '3mo+'
}

interface Props {
  opportunities: Opportunity[]
}

export default function OpportunityList({ opportunities }: Props) {
  const [search, setSearch]         = useState('')
  const [activeCats, setActiveCats] = useState<string[]>([])
  const [activeTime, setActiveTime] = useState<TimeFilter>('all')

  const presentCats = useMemo(
    () => ALL_CATS.filter(c => opportunities.some(o => o.category === c)),
    [opportunities],
  )

  const toggleCat = (cat: string) =>
    setActiveCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return opportunities.filter(o => {
      const matchCat  = activeCats.length === 0 || activeCats.includes(o.category)
      const matchTime = activeTime === 'all' || getTimeBucket(o.timeToRevenue) === activeTime
      const matchText = !q || [o.title, o.summary, o.description, o.painPoint, ...o.tags, o.revenueModel]
        .some(t => t.toLowerCase().includes(q))
      return matchCat && matchTime && matchText
    })
  }, [opportunities, search, activeCats, activeTime])

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-r-muted text-base pointer-events-none">
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索机会关键词…"
          className="w-full bg-r-card border border-r-border rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-r-text placeholder:text-r-muted/60 font-sans outline-none focus:border-r-accent focus:ring-2 focus:ring-r-accent/10 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-r-muted hover:text-r-text text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase shrink-0">类别</span>
        <button
          onClick={() => setActiveCats([])}
          className={`font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${
            activeCats.length === 0
              ? 'border-r-accent bg-r-accent text-white shadow-sm'
              : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-accent hover:-translate-y-px'
          }`}
        >
          全部 ({opportunities.length})
        </button>
        {presentCats.map(cat => {
          const active = activeCats.includes(cat)
          const color  = CAT_COLORS[cat] ?? '#6B7280'
          const count  = opportunities.filter(o => o.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                active
                  ? ''
                  : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-accent hover:-translate-y-px'
              }`}
              style={active ? { borderColor: color, background: color, color: 'white' } : {}}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Time-to-revenue filter */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase shrink-0">变现周期</span>
        {TIME_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTime(value)}
            className={`font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${
              activeTime === value
                ? 'border-r-time bg-r-time text-white shadow-sm'
                : 'border-r-border bg-r-card text-r-muted hover:border-teal-300 hover:text-r-time hover:-translate-y-px'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((opp, i) => (
            <OpportunityCard key={opp.id} opportunity={opp} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-r-border rounded-2xl bg-r-card">
          <p className="font-display text-2xl font-bold text-r-muted mb-2">无结果</p>
          <p className="font-mono text-[12px] text-r-faint tracking-wider">
            {search ? `没有找到「${search}」相关机会` : '当前筛选条件下暂无数据'}
          </p>
        </div>
      )}

      {filtered.length > 0 && filtered.length < opportunities.length && (
        <p className="font-mono text-[11px] text-r-muted text-center mt-6 tracking-wider">
          显示 {filtered.length} / {opportunities.length} 条结果
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 验证编译**

```bash
npm run build 2>&1 | tail -10
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/OpportunityList.tsx
git commit -m "feat: add time-to-revenue filter with getTimeBucket parsing"
```

---

## Task 6: 重写 OpportunityCard，新增彩色卡头

**Files:**
- Modify: `components/OpportunityCard.tsx`

- [ ] **Step 1: 替换 OpportunityCard.tsx 全部内容**

新增 `headerBg` 渐变字段，卡片顶部独立彩色头部区域，字号全面上调，亮色主题下的色值引用：

```tsx
import type { Opportunity } from '@/lib/opportunities'

const CATS: Record<string, { color: string; bg: string; headerBg: string; label: string }> = {
  'AI应用':   { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  headerBg: 'linear-gradient(90deg,#EDE9FE,#F5F4FF)', label: 'AI应用' },
  '自媒体':   { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  headerBg: 'linear-gradient(90deg,#EDE9FE,#F5F4FF)', label: '自媒体' },
  'SaaS工具': { color: '#059669', bg: 'rgba(5,150,105,0.08)',   headerBg: 'linear-gradient(90deg,#D1FAE5,#F0FDF4)', label: 'SaaS' },
  '整活玩具': { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   headerBg: 'linear-gradient(90deg,#FEE2E2,#FFF5F5)', label: '整活' },
  '本地服务': { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   headerBg: 'linear-gradient(90deg,#FEF3C7,#FFFBEB)', label: '本地' },
  '内容创作': { color: '#EA580C', bg: 'rgba(234,88,12,0.08)',   headerBg: 'linear-gradient(90deg,#FFEDD5,#FFF7ED)', label: '内容' },
}

function Dots({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <span className="flex gap-[3px] items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[14px] h-[3px] rounded-full"
          style={{ background: i < value ? color : '#E5E3F5' }}
        />
      ))}
    </span>
  )
}

export default function OpportunityCard({
  opportunity: o,
  index,
}: {
  opportunity: Opportunity
  index: number
}) {
  const cat = CATS[o.category] ?? {
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.08)',
    headerBg: 'linear-gradient(90deg,#F3F4F6,#F9FAFB)',
    label: o.category,
  }
  const num = String(index + 1).padStart(2, '0')

  return (
    <article
      className="rounded-2xl border border-r-border bg-r-card card-lift fade-in overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Colored header */}
      <div
        className="flex items-center gap-2 px-5 py-3 border-b border-r-border flex-wrap"
        style={{ background: cat.headerBg }}
      >
        <span
          className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ background: cat.color }}
        >
          {cat.label}
        </span>
        <span className="font-mono text-[11px] text-r-muted border border-r-border rounded-full px-2.5 py-1 bg-white">
          {o.market}
        </span>
        <span
          className="font-mono text-[11px] px-2.5 py-1 rounded-full border"
          style={{ background: '#F0FDFA', borderColor: '#CCFBF1', color: '#0D9488' }}
        >
          ⚡ {o.timeToRevenue}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] text-r-muted">潜力</span>
          <Dots value={Math.round(o.potential / 2)} max={5} color={cat.color} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5">
        {/* Index + Title */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-[11px] text-r-dim flex-shrink-0 tabular-nums font-semibold">{num}</span>
          <h2 className="font-display font-extrabold text-[19px] text-r-text leading-snug tracking-tight">
            {o.title}
          </h2>
        </div>

        <p className="font-sans text-[14px] text-r-muted leading-relaxed mb-3 pl-[26px]">
          {o.summary}
        </p>

        {/* Tags */}
        {o.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pl-[26px]">
            {o.tags.map(t => (
              <span
                key={t}
                className="font-mono text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: cat.bg, color: cat.color }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="font-sans text-[14px] text-r-text/80 leading-[1.75] mb-4">
          {o.description}
        </p>

        {/* Pain point */}
        <div
          className="rounded-r-lg px-4 py-3 mb-4 border-l-[3px]"
          style={{ background: '#FFFBEB', borderLeftColor: '#F59E0B' }}
        >
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase block mb-1"
            style={{ color: '#B45309' }}
          >
            核心痛点
          </span>
          <span className="font-sans text-[13px] text-r-text/80 leading-relaxed">{o.painPoint}</span>
        </div>

        {/* Path */}
        <div className="mb-4">
          <p className="font-mono text-[10px] text-r-faint tracking-[0.2em] uppercase mb-3">执行路径</p>
          <ol className="space-y-3">
            {o.path.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold mt-0.5"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {i + 1}
                </span>
                <span className="font-sans text-[14px] text-r-text/75 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Divider */}
        <div className="border-t border-r-border my-4" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          {[
            { label: '回收周期', value: o.timeToRevenue, style: { color: '#1E1B4B' } },
            { label: '启动成本', value: o.startupCost,   style: { color: '#059669' } },
            { label: '竞争程度', value: o.competition,    style: { color: '#1E1B4B' } },
          ].map(({ label, value, style }) => (
            <div key={label}>
              <p className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase mb-1.5">{label}</p>
              <p className="font-mono text-[13px] font-semibold" style={style}>{value}</p>
            </div>
          ))}
          <div>
            <p className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase mb-2">执行难度</p>
            <Dots value={o.difficulty} max={5} color={cat.color} />
          </div>
        </div>

        {/* Revenue model */}
        <p className="font-sans text-[13px] text-r-muted mb-3 leading-relaxed">
          <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase mr-2">收益模式</span>
          {o.revenueModel}
        </p>

        {/* Sources */}
        {o.sources.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {o.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-wide transition-all flex items-center gap-1 hover:opacity-100"
                style={{ color: cat.color, opacity: 0.65 }}
              >
                <span>{s.title}</span>
                <span style={{ fontSize: '10px' }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: 验证编译**

```bash
npm run build 2>&1 | tail -10
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/OpportunityCard.tsx
git commit -m "style: redesign card with colored header band and larger typography"
```

---

## Task 7: 更新日期页面简报横幅与宽度

**Files:**
- Modify: `app/[date]/page.tsx`

- [ ] **Step 1: 修改 `[date]/page.tsx` 中两处**

**修改 1**：`main` 标签的 `max-w-3xl` → 响应式宽度：

```tsx
// 将:
<main className="max-w-3xl mx-auto px-4 pb-20">
// 改为:
<main className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 pb-20">
```

**修改 2**：简报卡片替换为紫色渐变横幅：

```tsx
// 将:
{data.summary && (
  <div className="rounded-2xl border border-r-border bg-r-card px-5 py-4 mb-6">
    <p className="font-mono text-[9px] text-r-accent tracking-[0.3em] uppercase mb-2">
      今日市场简报 · {data.date}
    </p>
    <p className="font-sans text-[13.5px] text-r-text/70 leading-relaxed">{data.summary}</p>
  </div>
)}
// 改为:
{data.summary && (
  <div
    className="rounded-2xl px-6 py-5 mb-6 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}
  >
    <div
      className="absolute right-4 top-0 select-none pointer-events-none leading-none text-white font-bold"
      style={{ fontSize: '90px', opacity: 0.06 }}
    >
      ⌖
    </div>
    <p className="font-mono text-[10px] text-white/70 tracking-[0.25em] uppercase mb-2">
      今日市场简报 · {data.date}
    </p>
    <p className="font-sans text-[14px] text-white/90 leading-relaxed relative">{data.summary}</p>
  </div>
)}
```

- [ ] **Step 2: 完整验证构建**

```bash
npm run build 2>&1 | tail -20
```

Expected: 无报错，Build 成功

- [ ] **Step 3: 启动 dev server 视觉验证**

```bash
npm run dev
```

打开 `http://localhost:3000` 检查：
- 页面背景为淡紫白色 `#F5F4FF`
- Header 白底毛玻璃，紫色渐变图标
- DateNav 为标签页样式，当前日期有紫色下划线
- 简报为紫色渐变横幅
- 筛选栏有「类别」和「变现周期」两行
- 卡片有彩色渐变头部，字号明显大于原版

- [ ] **Step 4: Commit**

```bash
git add app/[date]/page.tsx
git commit -m "style: purple gradient summary banner and responsive max-width"
```
