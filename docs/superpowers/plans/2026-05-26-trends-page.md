# 今日技术风口独立页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将「今日技术风口」从每日机会页剥离为独立 SSG 页面 `/trends/[date]`，并在 NavBar 添加入口。

**Architecture:** 新建 `app/trends/page.tsx`（redirect 入口）和 `app/trends/[date]/page.tsx`（SSG 主页面），复用现有 `TechSignals` 和 `DateNav` 组件；给 `DateNav` 加一个可选 `basePath` prop 以支持不同路由前缀；从 `[date]/page.tsx` 删除 `TechSignals`。

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS

---

## File Map

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `components/DateNav.tsx` | 新增 `basePath?: string` prop |
| Create | `app/trends/page.tsx` | redirect 到最新日期 |
| Create | `app/trends/[date]/page.tsx` | SSG 技术风口主页面 |
| Modify | `components/NavBar.tsx` | 新增「技术风口」导航项 |
| Modify | `app/[date]/page.tsx` | 删除 TechSignals |

---

## Task 1: 给 DateNav 加 basePath prop

**Files:**
- Modify: `components/DateNav.tsx`

- [ ] **Step 1: 更新 Props 接口，加入 basePath**

  将文件顶部的 `interface Props` 替换为：

  ```tsx
  interface Props {
    dates: string[]
    currentDate: string
    basePath?: string
  }
  ```

- [ ] **Step 2: 更新函数签名，解构 basePath**

  ```tsx
  export default function DateNav({ dates, currentDate, basePath = '' }: Props) {
  ```

- [ ] **Step 3: 更新 Link 的 href**

  将第 23 行的：
  ```tsx
  href={`/${date}`}
  ```
  改为：
  ```tsx
  href={`${basePath}/${date}`}
  ```

- [ ] **Step 4: 验证类型通过**

  ```bash
  cd /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错（现有调用方不传 basePath，默认 `""` 不影响生成的路径）

- [ ] **Step 5: 提交**

  ```bash
  git add components/DateNav.tsx
  git commit -m "feat: add basePath prop to DateNav for multi-route support"
  ```

---

## Task 2: 新建 app/trends/page.tsx（redirect 入口）

**Files:**
- Create: `app/trends/page.tsx`

- [ ] **Step 1: 创建文件**

  ```tsx
  import { redirect } from 'next/navigation'
  import { notFound } from 'next/navigation'
  import { getLatestDate } from '@/lib/opportunities'

  export default function TrendsRedirectPage() {
    const latest = getLatestDate()
    if (!latest) notFound()
    redirect(`/trends/${latest}`)
  }
  ```

- [ ] **Step 2: 验证类型通过**

  ```bash
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错

- [ ] **Step 3: 提交**

  ```bash
  git add app/trends/page.tsx
  git commit -m "feat: add /trends redirect to latest date"
  ```

---

## Task 3: 新建 app/trends/[date]/page.tsx（SSG 主页面）

**Files:**
- Create: `app/trends/[date]/page.tsx`

- [ ] **Step 1: 创建文件**

  ```tsx
  import { notFound } from 'next/navigation'
  import { getAllDates, getOpportunities } from '@/lib/opportunities'
  import DateNav from '@/components/DateNav'
  import TechSignals from '@/components/TechSignals'

  export async function generateStaticParams() {
    return getAllDates().map(date => ({ date }))
  }

  export async function generateMetadata({ params }: { params: { date: string } }) {
    return {
      title: `${params.date} 技术风口 · 见微 Prowl`,
      description: `${params.date} GitHub 技术趋势`,
    }
  }

  export default function TrendsDatePage({ params }: { params: { date: string } }) {
    const data = getOpportunities(params.date)
    if (!data) notFound()

    const allDates = getAllDates()

    return (
      <div className="min-h-screen">
        <main className="max-w-6xl mx-auto px-6 pb-20">
          <DateNav dates={allDates} currentDate={params.date} basePath="/trends" />
          <TechSignals staticRepos={data.trending} />
          <p className="font-mono text-[10px] text-r-muted/40 text-center mt-12 tracking-[0.2em] uppercase">
            见微 Prowl · 由 Claude AI 每日自动生成 · 仅供参考
          </p>
        </main>
      </div>
    )
  }
  ```

- [ ] **Step 2: 验证类型通过**

  ```bash
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错

- [ ] **Step 3: 提交**

  ```bash
  git add "app/trends/[date]/page.tsx"
  git commit -m "feat: add /trends/[date] SSG page for tech signals"
  ```

  > 注意：git 路径中含方括号，必须用引号包裹，否则 shell 会展开 glob。

---

## Task 4: 更新 NavBar + 从每日机会页删除 TechSignals

**Files:**
- Modify: `components/NavBar.tsx`
- Modify: `app/[date]/page.tsx`

- [ ] **Step 1: 在 NavBar 追加导航项**

  将 `components/NavBar.tsx` 中的 `NAV_ITEMS` 替换为：

  ```ts
  const NAV_ITEMS = [
    {
      href: '/',
      label: '每日机会',
      match: (p: string) => /^\/\d{4}-\d{2}-\d{2}/.test(p) || p === '/',
    },
    {
      href: '/trends',
      label: '技术风口',
      match: (p: string) => p.startsWith('/trends'),
    },
  ]
  ```

- [ ] **Step 2: 从每日机会页删除 TechSignals import**

  在 `app/[date]/page.tsx` 删除这一行：

  ```tsx
  import TechSignals from '@/components/TechSignals'
  ```

- [ ] **Step 3: 从每日机会页删除 TechSignals 渲染**

  在 `app/[date]/page.tsx` 删除以下两行（包括注释）：

  ```tsx
  {/* Tech signals strip */}
  <TechSignals staticRepos={data.trending} />
  ```

- [ ] **Step 4: 验证类型通过**

  ```bash
  npx tsc --noEmit --skipLibCheck
  ```

  预期：无报错

- [ ] **Step 5: 提交**

  ```bash
  git add components/NavBar.tsx "app/[date]/page.tsx"
  git commit -m "feat: add tech signals nav entry; remove TechSignals from daily page"
  ```

---

## Task 5: 本地验证

- [ ] **Step 1: 启动开发服务器**

  ```bash
  npm run dev
  ```

- [ ] **Step 2: 验证每日机会页**

  打开 `http://localhost:3000`，检查：
  - 跳转到最新日期 `/[date]`
  - 页面**不再**显示「今日技术风口」GitHub 仓库区块
  - NavBar 出现「技术风口」标签，点击跳转到 `/trends/[date]`

- [ ] **Step 3: 验证技术风口页**

  打开 `http://localhost:3000/trends`，检查：
  - 自动 redirect 到 `/trends/[最新日期]`
  - 显示 DateNav（日期切换条）
  - 显示 GitHub trending repos 卡片网格
  - 点击 DateNav 中其他日期，URL 变为 `/trends/[date]`，内容刷新
  - NavBar「技术风口」标签处于 active 状态（紫色下划线）

- [ ] **Step 4: 验证 NavBar active 状态**

  在 `/[date]` 页面：「每日机会」active，「技术风口」inactive  
  在 `/trends/[date]` 页面：「技术风口」active，「每日机会」inactive
