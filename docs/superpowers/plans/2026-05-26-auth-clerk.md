# F6 账号系统（Clerk Auth）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入 Clerk 实现 Google + 邮箱 OTP 登录，投票记录从 localStorage 迁移至 Redis 按 userId 存储，未登录点击投票弹出登录 Modal。

**Architecture:** `ClerkProvider` 包裹全局 layout，`clerkMiddleware` 注入 `auth()` 上下文。`POST /api/vote` 校验 userId 并写 Redis `voted:{userId}:{date}:{id}`；`GET /api/votes` 已登录时额外批量拉取用户投票状态作为 `myVote` 字段返回。`VoteBar` 删除 localStorage，改用 Clerk hooks 判断登录态，未登录点击调 `openSignIn()`。

**Tech Stack:** `@clerk/nextjs` v5，Upstash Redis（已有），Next.js 14 App Router，TypeScript

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `middleware.ts` | 新增 | Clerk 中间件，让所有路由能读取 auth 状态 |
| `app/sign-in/[[...sign-in]]/page.tsx` | 新增 | Clerk sign-in 页（Modal fallback 用） |
| `app/layout.tsx` | 修改 | 包裹 `<ClerkProvider>` |
| `components/Header.tsx` | 修改 | 加 SignInButton / UserButton |
| `app/api/vote/route.ts` | 修改 | auth() 校验 + Redis userId 投票去重 |
| `app/api/votes/route.ts` | 修改 | 已登录时批量拉 myVote |
| `hooks/useVotes.ts` | 修改 | VoteCounts 类型加 myVote 字段 |
| `components/VoteBar.tsx` | 修改 | 删 localStorage，改用 Clerk hooks |

---

### Task 1: Clerk 控制台配置 + 安装依赖

**Files:**
- Modify: `package.json`（install）
- Modify: `.env.local`

- [ ] **Step 1: 创建 Clerk 应用**

打开 [https://dashboard.clerk.com](https://dashboard.clerk.com)，注册后：
1. 点击 **Create application**
2. Application name：`见微 Prowl`
3. Sign-in options：勾选 **Google** 和 **Email** (OTP)
4. 点击 **Create application**

进入应用后，点击左侧 **API Keys**，复制：
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`（以 `pk_test_` 或 `pk_live_` 开头）
- `CLERK_SECRET_KEY`（以 `sk_test_` 或 `sk_live_` 开头）

- [ ] **Step 2: 配置 Allowed origins**

在 Clerk Dashboard → **Domains** → 添加：
- `https://opradar.indevs.in`
- `http://localhost:3000`
- `http://localhost:3001`

- [ ] **Step 3: 写入 .env.local**

打开 `/Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar/.env.local`，在文件末尾追加（替换尖括号内容为实际值）：

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_publishable_key>
CLERK_SECRET_KEY=<your_secret_key>
```

- [ ] **Step 4: 安装 @clerk/nextjs**

```bash
cd /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar
npm install @clerk/nextjs
```

Expected：`added N packages`，无报错。

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @clerk/nextjs"
```

（不提交 .env.local，已在 .gitignore）

---

### Task 2: Clerk 中间件

**Files:**
- Create: `middleware.ts`（项目根目录，与 `next.config.js` 同级）

- [ ] **Step 1: 创建 `middleware.ts`**

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出（零错误）。

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add Clerk middleware"
```

---

### Task 3: ClerkProvider 包裹 layout

**Files:**
- Modify: `app/layout.tsx`

当前文件第 1-7 行（imports）：
```typescript
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import Header from '@/components/Header'
import './globals.css'
```

- [ ] **Step 1: 修改 `app/layout.tsx`**

将文件完整替换为：

```typescript
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import Header from '@/components/Header'
import './globals.css'

const syne = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

const SITE_URL = 'https://opportunity-radar-ruby.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '见微 Prowl',
    template: '%s · 见微 Prowl',
  },
  description: '见微知著 · AI 每天扫描 GitHub Trending 和市场热点，为你发现肉眼难见的副业机会。',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  openGraph: {
    siteName: '见微 Prowl',
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@opportunityradar',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="zh-CN" className={`${syne.variable} ${mono.variable}`}>
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app with ClerkProvider"
```

---

### Task 4: Sign-in 备用页面

**Files:**
- Create: `app/sign-in/[[...sign-in]]/page.tsx`

- [ ] **Step 1: 创建目录和文件**

```bash
mkdir -p /Users/sanli/Desktop/workplace/ai-programme/workspace/projects/opportunity-radar/app/sign-in/'[[...sign-in]]'
```

创建 `app/sign-in/[[...sign-in]]/page.tsx`：

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <SignIn />
    </div>
  )
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: Commit**

```bash
git add "app/sign-in/[[...sign-in]]/page.tsx"
git commit -m "feat: add Clerk sign-in fallback page"
```

---

### Task 5: Header 加登录/用户按钮

**Files:**
- Modify: `components/Header.tsx`

- [ ] **Step 1: 修改 `components/Header.tsx`**

将文件完整替换为：

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import SubscribeForm from './SubscribeForm'

const NAV_ITEMS = [
  { href: '/', label: '每日机会', match: (p: string) => /^\/\d{4}-\d{2}-\d{2}/.test(p) || p === '/' },
]

export default function Header() {
  const [time, setTime] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-r-border bg-white/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
            <Image src="/logo.png" alt="见微 Prowl" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-mono text-[9px] text-r-accent tracking-[0.3em] uppercase leading-none mb-0.5">
              Prowl
            </div>
            <div className="font-display font-bold text-[17px] text-r-text leading-none tracking-tight">
              见微
            </div>
          </div>
        </div>

        {/* Center: nav */}
        <nav className="hidden md:flex items-center h-full">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative h-full flex items-center px-4 font-mono text-[12px] tracking-wide transition-colors ${
                  active ? 'text-r-accent' : 'text-r-muted hover:text-r-text'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-r-accent rounded-t-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: auth + subscribe + clock */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="font-mono text-[12px] tracking-wide px-3 py-1.5 rounded-full border border-r-accent text-r-accent hover:bg-r-accent hover:text-white transition-all">
                登录
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
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

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add Clerk sign-in/user buttons to Header"
```

---

### Task 6: 更新 POST /api/vote（加 auth + Redis 去重）

**Files:**
- Modify: `app/api/vote/route.ts`

- [ ] **Step 1: 替换 `app/api/vote/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const { date, id, type } = body

    if (
      typeof date !== 'string' ||
      typeof id !== 'number' ||
      (type !== 'up' && type !== 'down')
    ) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const userVoteKey = `voted:${userId}:${date}:${id}`
    const existing = await kv.get(userVoteKey)
    if (existing) {
      return NextResponse.json({ error: '已投票' }, { status: 409 })
    }

    const key = `votes:${date}:${id}`
    await kv.hincrby(key, type, 1)
    await kv.set(userVoteKey, type)
    const result = await kv.hgetall<{ up?: string; down?: string }>(key)

    return NextResponse.json({
      up: parseInt(result?.up ?? '0', 10),
      down: parseInt(result?.down ?? '0', 10),
    })
  } catch (err) {
    console.error('vote error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: 启动 dev server 测试（dev server 可能已在跑）**

```bash
# 如果 dev server 未在运行，先启动：
npm run dev -- --port 3001 &
sleep 5
```

测试未登录时返回 401：
```bash
curl -s --noproxy localhost,127.0.0.1 -X POST http://localhost:3001/api/vote \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-26","id":1,"type":"up"}'
```

Expected：`{"error":"请先登录"}` (HTTP 401)

- [ ] **Step 4: Commit**

```bash
git add app/api/vote/route.ts
git commit -m "feat: add auth check and per-user vote dedup to POST /api/vote"
```

---

### Task 7: 更新 GET /api/votes（加 myVote 字段）

**Files:**
- Modify: `app/api/votes/route.ts`

- [ ] **Step 1: 替换 `app/api/votes/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const idsParam = searchParams.get('ids')

    if (!date || !idsParam) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const ids = idsParam.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
    if (ids.length === 0) {
      return NextResponse.json({})
    }

    // Batch fetch aggregate counts
    const pipeline = kv.pipeline()
    for (const id of ids) {
      pipeline.hgetall(`votes:${date}:${id}`)
    }
    const results = await pipeline.exec()

    // Batch fetch per-user vote state (if logged in)
    const { userId } = await auth()
    let myVoteResults: (string | null)[] = ids.map(() => null)

    if (userId) {
      const pipeline2 = kv.pipeline()
      for (const id of ids) {
        pipeline2.get(`voted:${userId}:${date}:${id}`)
      }
      myVoteResults = (await pipeline2.exec()) as (string | null)[]
    }

    const response: Record<string, { up: number; down: number; myVote: 'up' | 'down' | null }> = {}
    ids.forEach((id, i) => {
      const raw = (results[i] ?? {}) as Record<string, string>
      const myVote = (myVoteResults[i] as 'up' | 'down' | null) ?? null
      response[String(id)] = {
        up: parseInt(raw.up ?? '0', 10),
        down: parseInt(raw.down ?? '0', 10),
        myVote,
      }
    })

    return NextResponse.json(response)
  } catch (err) {
    console.error('votes error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: 测试批量读取（dev server 需运行）**

```bash
curl -s --noproxy localhost,127.0.0.1 "http://localhost:3001/api/votes?date=2026-05-26&ids=1,2,3"
```

Expected（未登录时 myVote 全为 null）：
```json
{
  "1": { "up": 0, "down": 0, "myVote": null },
  "2": { "up": 0, "down": 0, "myVote": null },
  "3": { "up": 0, "down": 0, "myVote": null }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/votes/route.ts
git commit -m "feat: add per-user myVote field to GET /api/votes"
```

---

### Task 8: 更新 useVotes hook（扩展类型）

**Files:**
- Modify: `hooks/useVotes.ts`

- [ ] **Step 1: 替换 `hooks/useVotes.ts`**

```typescript
'use client'

import { useState, useEffect } from 'react'

export type VoteCounts = { up: number; down: number; myVote?: 'up' | 'down' | null }

export function useVotes(
  date: string,
  ids: number[],
): Record<number, VoteCounts> {
  const [counts, setCounts] = useState<Record<number, VoteCounts>>({})
  const idsKey = ids.join(',')

  useEffect(() => {
    if (!idsKey) return
    fetch(`/api/votes?date=${encodeURIComponent(date)}&ids=${idsKey}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: Record<string, { up: number; down: number; myVote?: 'up' | 'down' | null }> | null) => {
        if (!data) return
        const mapped: Record<number, VoteCounts> = {}
        for (const [key, val] of Object.entries(data)) {
          mapped[Number(key)] = val
        }
        setCounts(mapped)
      })
      .catch(() => {})
  }, [date, idsKey])

  return counts
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: Commit**

```bash
git add hooks/useVotes.ts
git commit -m "feat: extend VoteCounts type with myVote field"
```

---

### Task 9: 更新 VoteBar（删除 localStorage，接入 Clerk）

**Files:**
- Modify: `components/VoteBar.tsx`

- [ ] **Step 1: 替换 `components/VoteBar.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import type { VoteCounts } from '@/hooks/useVotes'

interface Props {
  date: string
  opportunityId: number
  initialCounts?: VoteCounts
}

export default function VoteBar({ date, opportunityId, initialCounts }: Props) {
  const [counts, setCounts] = useState<{ up: number; down: number }>({ up: 0, down: 0 })
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(false)
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  // When parent hydrates initialCounts from useVotes, update counts and restore voted state
  useEffect(() => {
    if (initialCounts) {
      setCounts({ up: initialCounts.up, down: initialCounts.down })
      if (initialCounts.myVote !== undefined) {
        setVoted(initialCounts.myVote ?? null)
      }
    }
  }, [initialCounts?.up, initialCounts?.down, initialCounts?.myVote]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleVote(type: 'up' | 'down') {
    if (!isSignedIn) {
      openSignIn()
      return
    }
    if (voted || loading) return

    // Optimistic update
    setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
    setVoted(type)
    setLoading(true)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, id: opportunityId, type }),
      })
      if (res.status === 409) return // already voted server-side, keep optimistic state
      if (!res.ok) throw new Error('vote failed')
      const data: { up: number; down: number } = await res.json()
      setCounts(data)
    } catch {
      // Rollback
      setCounts(prev => ({ ...prev, [type]: prev[type] - 1 }))
      setVoted(null)
      alert('投票失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = voted !== null || loading

  function btnStyle(type: 'up' | 'down') {
    const isVoted = voted === type
    const isOther = voted !== null && voted !== type
    return {
      background: isVoted
        ? type === 'up' ? '#f0fdf4' : '#fef2f2'
        : isOther
          ? '#f9fafb'
          : type === 'up' ? '#f0fdf4' : '#fef2f2',
      color: isVoted
        ? type === 'up' ? '#16a34a' : '#dc2626'
        : isOther
          ? '#9ca3af'
          : type === 'up' ? '#16a34a' : '#dc2626',
      borderRadius: '20px',
      padding: '7px 16px',
      fontSize: '14px',
      fontWeight: 600,
      border: 'none',
      cursor: isDisabled ? 'default' : 'pointer',
      opacity: isOther ? 0.5 : 1,
      transition: 'all 0.15s',
    } as React.CSSProperties
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-r-border mt-3">
      <span className="font-mono text-[11px] text-r-faint tracking-[0.15em] uppercase flex-1">
        对你有帮助吗？
      </span>
      <button onClick={() => handleVote('up')} disabled={isDisabled} style={btnStyle('up')}>
        👍 {counts.up > 0 ? counts.up : ''}
      </button>
      <button onClick={() => handleVote('down')} disabled={isDisabled} style={btnStyle('down')}>
        👎 {counts.down > 0 ? counts.down : ''}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 验证 TypeScript 通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected：无输出。

- [ ] **Step 3: Commit**

```bash
git add components/VoteBar.tsx
git commit -m "feat: replace localStorage with Clerk auth in VoteBar"
```

---

### Task 10: Vercel 环境变量配置 + 端到端测试 & 推送

**Files:**（无代码改动，配置 + 测试）

- [ ] **Step 1: 在 Vercel 配置环境变量**

打开 [Vercel Dashboard](https://vercel.com/dashboard) → 项目 opportunity-radar → **Settings** → **Environment Variables**，添加：

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Production, Preview, Development |
| `CLERK_SECRET_KEY` | `sk_live_...` | Production, Preview, Development |

- [ ] **Step 2: 本地端到端测试**

确保 dev server 在运行（`npm run dev -- --port 3001`），打开浏览器访问 `http://localhost:3001`：

1. **未登录状态**：Header 右上角显示「登录」按钮
2. **点击登录**：弹出 Clerk Modal，显示 Google 登录和邮箱 OTP 两个选项
3. **用 Google 登录**：完成后 Modal 关闭，Header 右上角变为头像（`UserButton`）
4. **点击投票 👍**：发请求成功，计数 +1，按钮高亮
5. **刷新页面**：已登录状态保留，投票状态恢复（`myVote` 从服务端返回）
6. **再次点击同一按钮**：无响应（409 被静默处理）
7. **点击头像 → Sign out**：退出登录，Header 恢复「登录」按钮
8. **退出后点击投票**：弹出登录 Modal

- [ ] **Step 3: 推送**

```bash
git push
```

等待 Vercel 自动部署（约 1-2 分钟），然后在 `opradar.indevs.in` 重复以上测试流程。
