# Email Subscription (Auth Version) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Logged-in users can subscribe to the daily digest with one click in the Header, using their Clerk account email — no manual input required.

**Architecture:** GET /api/subscribe checks Redis for the user's subscription state; POST /api/subscribe fetches the user's primary email from Clerk server-side (never trusting client-supplied email), adds them to Resend Audience, and writes a Redis key. A `useSubscription` hook manages state client-side, and the Header renders a subscribe button or "✓ 已订阅" based on that state.

**Tech Stack:** Next.js 14 App Router, @clerk/nextjs@7.4.1, @upstash/redis@1.38, Resend REST API, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/api/subscribe/route.ts` | Rewrite | GET (check state) + POST (subscribe) with Clerk auth |
| `hooks/useSubscription.ts` | Create | Client hook: fetches state, exposes `subscribe()` |
| `components/Header.tsx` | Modify | Add subscribe UI between clock and UserButton |

`lib/kv.ts`, `components/SubscribeForm.tsx`, `app/api/send-digest/route.ts` are **not touched**.

---

### Task 1: Rewrite `/api/subscribe` route

**Files:**
- Modify: `app/api/subscribe/route.ts` (full rewrite)

**Context:**
- `lib/kv.ts` exports `kv` (Upstash Redis singleton) — import and use it
- Resend AUDIENCE_ID is already in the file: `588d987b-8ad6-4acd-a267-ed5f9b15d64f`
- Clerk v7: `clerkClient` is imported from `@clerk/nextjs/server` and is an **async factory** — call it as `await clerkClient()`
- `auth()` from `@clerk/nextjs/server` returns `{ userId: string | null }` — must be awaited
- Redis key pattern: `subscribe:{userId}` → value is the user's primary email string

- [ ] **Step 1: Replace the entire file with this implementation**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'

const RESEND_KEY = process.env.RESEND_API_KEY!
const AUDIENCE_ID = '588d987b-8ad6-4acd-a267-ed5f9b15d64f'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const existing = await kv.get(`subscribe:${userId}`)
  return NextResponse.json({ subscribed: existing !== null })
}

export async function POST(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // Idempotent: already subscribed
  const existing = await kv.get(`subscribe:${userId}`)
  if (existing !== null) {
    return NextResponse.json({ ok: true, subscribed: true })
  }

  // Fetch primary email from Clerk (never trust client-supplied email)
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses.find(
    e => e.id === user.primaryEmailAddressId,
  )?.emailAddress

  if (!email) {
    return NextResponse.json({ error: '账号无绑定邮箱' }, { status: 400 })
  }

  // Add to Resend Audience
  const res = await fetch(
    `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    },
  )

  if (!res.ok) {
    const err = await res.json()
    // contact_already_exists is fine — still write Redis key
    if (err.name !== 'contact_already_exists') {
      console.error('Resend error:', err)
      return NextResponse.json({ error: '订阅失败，请稍后再试' }, { status: 500 })
    }
  }

  // Write Redis key
  await kv.set(`subscribe:${userId}`, email)

  return NextResponse.json({ ok: true, subscribed: true })
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
npm run dev
```

Expected: no TypeScript errors in terminal, server starts on port 3000.

- [ ] **Step 3: Test GET endpoint (unauthenticated)**

```bash
curl --noproxy localhost,127.0.0.1 http://localhost:3000/api/subscribe
```

Expected: `{"error":"请先登录"}` with HTTP 401.

- [ ] **Step 4: Commit**

```bash
git add app/api/subscribe/route.ts
git commit -m "feat: rewrite subscribe API with Clerk auth and Redis state"
```

---

### Task 2: Create `hooks/useSubscription.ts`

**Files:**
- Create: `hooks/useSubscription.ts`

**Context:**
- Follow the exact pattern of `hooks/useVotes.ts`: `'use client'` directive, `useState` + `useEffect`, `useUser` from `@clerk/nextjs`
- `useUser()` returns `{ isSignedIn: boolean | undefined }` — wait for it to be defined before fetching
- Optimistic update on `subscribe()`: set `subscribed: true` immediately, rollback on error
- GET /api/subscribe returns `{ subscribed: boolean }`
- POST /api/subscribe returns `{ ok: true, subscribed: true }` or an error object

- [ ] **Step 1: Create the hook file**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useSubscription(): {
  subscribed: boolean
  loading: boolean
  subscribe: () => Promise<void>
} {
  const { isSignedIn } = useUser()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/subscribe')
      .then(r => (r.ok ? r.json() : null))
      .then((data: { subscribed: boolean } | null) => {
        if (data) setSubscribed(data.subscribed)
      })
      .catch(() => {})
  }, [isSignedIn])

  async function subscribe() {
    if (subscribed || loading) return
    setSubscribed(true) // optimistic
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' })
      if (!res.ok) throw new Error('subscribe failed')
    } catch {
      setSubscribed(false) // rollback
      alert('订阅失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return { subscribed, loading, subscribe }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no lines matching `error` from the new file. (Full build may have other unrelated output — only look for new errors.)

- [ ] **Step 3: Commit**

```bash
git add hooks/useSubscription.ts
git commit -m "feat: add useSubscription hook"
```

---

### Task 3: Update Header with subscribe UI

**Files:**
- Modify: `components/Header.tsx`

**Context — current right section of Header (lines 68–91):**
```tsx
{/* Right: clock + auth */}
<div className="flex items-center gap-4">
  <div className="text-right hidden sm:block">
    <div className="font-mono text-[9px] text-r-muted tracking-[0.2em] uppercase leading-none mb-1">
      CST · AI Powered
    </div>
    <div className="font-mono text-sm text-r-accent tabular-nums font-semibold">
      {time || '──:──:──'}
    </div>
  </div>
  {!isSignedIn && (
    <SignInButton mode="modal">
      <button className="font-mono text-[13px] font-bold tracking-wide px-5 py-2 rounded-full bg-r-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm">
        登录 / 注册
      </button>
    </SignInButton>
  )}
  {isSignedIn && <UserButton />}
</div>
```

The subscribe UI goes **between the clock div and the existing auth buttons** (i.e., after the clock, before the `SignInButton`/`UserButton`).

- [ ] **Step 1: Add the import for useSubscription at the top of the file**

Add this line after the existing Clerk imports (around line 8):
```typescript
import { useSubscription } from '@/hooks/useSubscription'
```

- [ ] **Step 2: Add the hook call inside the component body, after the existing `const { isSignedIn } = useAuth()` line**

```typescript
const { subscribed, loading, subscribe } = useSubscription()
```

- [ ] **Step 3: Replace the right section with the updated JSX**

Replace the entire `{/* Right: clock + auth */}` block with:

```tsx
{/* Right: clock + subscribe + auth */}
<div className="flex items-center gap-3">
  <div className="text-right hidden sm:block">
    <div className="font-mono text-[9px] text-r-muted tracking-[0.2em] uppercase leading-none mb-1">
      CST · AI Powered
    </div>
    <div className="font-mono text-sm text-r-accent tabular-nums font-semibold">
      {time || '──:──:──'}
    </div>
  </div>
  {isSignedIn && !subscribed && (
    <button
      onClick={subscribe}
      disabled={loading}
      className="hidden sm:block font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border border-r-accent text-r-accent hover:bg-r-accent hover:text-white transition-all disabled:opacity-50"
    >
      订阅每日推送
    </button>
  )}
  {isSignedIn && subscribed && (
    <span className="hidden sm:block font-mono text-[11px] text-r-muted tracking-wide">
      ✓ 已订阅
    </span>
  )}
  {!isSignedIn && (
    <SignInButton mode="modal">
      <button className="font-mono text-[13px] font-bold tracking-wide px-5 py-2 rounded-full bg-r-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm">
        登录 / 注册
      </button>
    </SignInButton>
  )}
  {isSignedIn && <UserButton />}
</div>
```

- [ ] **Step 4: Verify in browser**

Start dev server: `npm run dev`

Check three states:
1. Not signed in → subscribe UI hidden, login button visible ✓
2. Signed in, not yet subscribed → "订阅每日推送" button appears ✓
3. Click button → loading state, then "✓ 已订阅" appears ✓

- [ ] **Step 5: Commit and push**

```bash
git add components/Header.tsx
git commit -m "feat: add one-click subscribe button in header for signed-in users"
git push
```

Expected: Vercel deployment triggers. After ~2 minutes, `opradar.indevs.in` shows the subscribe button for logged-in users.

---

## Environment Variables Required

These must be set in Vercel project settings (in addition to what's already there):

| Variable | Where to get it |
|----------|----------------|
| `RESEND_API_KEY` | Resend dashboard → API Keys |

Check: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` are already configured in Vercel.

> **Note:** If `RESEND_API_KEY` is not yet in Vercel env vars, add it before pushing, otherwise the POST route will fail silently on production.
