# Email Subscription (Auth Version) Design

**Goal:** Logged-in users can subscribe to the daily digest with one click in the Header, using their Clerk account email automatically.

**Date:** 2026-05-26

---

## Overview

Replace the old anonymous email-input form (removed from Header) with a one-click subscription button that appears for authenticated users. Subscription state is persisted in Redis so it survives page reloads. The actual email delivery pipeline (Resend Audience + `send-digest` API) is unchanged.

---

## Architecture

### Data Layer

**Redis key:** `subscribe:{userId}` → value is the user's primary email string

- Written on subscribe
- No unsubscribe in this iteration (out of scope)
- Checked on every Header mount for signed-in users

### API Layer

**`GET /api/subscribe`**
- Auth: requires Clerk session (returns 401 if not signed in)
- Reads `subscribe:{userId}` from Redis
- Returns `{ subscribed: boolean }`

**`POST /api/subscribe`**
- Auth: requires Clerk session (returns 401 if not signed in)
- Fetches user's primary email via `clerkClient().users.getUser(userId)` — does NOT accept email from client body (prevents spoofing)
- Idempotent: if `subscribe:{userId}` already exists in Redis, returns `{ ok: true, subscribed: true }` immediately without re-calling Resend
- On new subscription:
  1. `POST https://api.resend.com/audiences/{AUDIENCE_ID}/contacts` with the user's email
  2. Resend `contact_already_exists` error is treated as success
  3. `kv.set('subscribe:{userId}', email)` in Redis
- Returns `{ ok: true, subscribed: true }`

### Hook: `hooks/useSubscription.ts`

```ts
export function useSubscription(): {
  subscribed: boolean
  loading: boolean
  subscribe: () => Promise<void>
}
```

- On mount (only when `isSignedIn`): `GET /api/subscribe` → sets `subscribed` state
- `subscribe()`: `POST /api/subscribe` with optimistic update → sets `subscribed: true` immediately, rolls back on error
- When `isSignedIn` is false: returns `{ subscribed: false, loading: false, subscribe: noop }`

### UI: Header changes

Location: between the clock and the UserButton (rightmost area).

States:
- **Not signed in:** nothing rendered (no subscribe UI at all)
- **Signed in, loading:** nothing rendered (avoids flash)
- **Signed in, not subscribed:** purple outlined button "订阅每日推送", clicking calls `subscribe()`
- **Signed in, subscribed:** grey text "✓ 已订阅" (non-interactive)

---

## Files Changed

| File | Change |
|------|--------|
| `app/api/subscribe/route.ts` | Full rewrite: add GET handler, rewrite POST to use Clerk auth + Clerk user email |
| `hooks/useSubscription.ts` | New file |
| `components/Header.tsx` | Import and use `useSubscription`, render subscribe UI between clock and UserButton |

`components/SubscribeForm.tsx`, `app/api/send-digest/route.ts`, and `emails/DailyDigest.tsx` are **not modified**.

---

## Error Handling

- GET fails → treat as `subscribed: false`, no error shown to user
- POST fails → roll back optimistic update, show `alert('订阅失败，请稍后再试')`
- Clerk user has no primary email → POST returns 400 `{ error: '账号无绑定邮箱' }`

---

## Out of Scope

- Unsubscribe button
- Subscription management page
- Email preference settings
