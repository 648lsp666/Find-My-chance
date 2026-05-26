# F6 账号系统（Clerk Auth）设计文档

**日期：** 2026-05-26
**状态：** 已确认，待实施
**目标：** 接入 Clerk 实现 Google + 邮箱 OTP 登录，投票记录从 localStorage 迁移至 Redis 按 userId 存储

---

## 问题陈述

现有投票使用 localStorage 防重，跨设备无效、无法关联用户身份。引入账号系统后，投票记录绑定 Clerk userId，为后续 Pro 功能打基础。未登录用户点击投票按钮时弹出登录 Modal。

---

## 架构概览

```
用户点击 👍/👎
  → 未登录：openSignIn() 弹 Clerk Modal
  → 已登录：POST /api/vote
            → auth() 获取 userId
            → GET voted:{userId}:{date}:{id}（已存在 → 409）
            → HINCRBY votes:{date}:{id} up/down 1
            → SET voted:{userId}:{date}:{id} "up"/"down"
            → 返回 { up, down }

页面加载
  → GET /api/votes?date=X&ids=1,2,3
            → Pipeline HGETALL votes:{date}:{id} × N（aggregate 计数，现有逻辑）
            → 若已登录：Pipeline GET voted:{userId}:{date}:{id} × N（用户投票状态）
            → 返回 { "1": { up: 5, down: 2, myVote: "up" | "down" | null } }
```

---

## 新增 / 修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `middleware.ts` | 新增 | Clerk 默认中间件，注入 `auth()` 上下文 |
| `app/sign-in/[[...sign-in]]/page.tsx` | 新增 | Clerk `<SignIn>` 备用跳转页（Modal fallback） |
| `app/layout.tsx` | 修改 | 包裹 `<ClerkProvider>` |
| `components/Header.tsx` | 修改 | 加 `<SignInButton mode="modal">` / `<UserButton>` |
| `app/api/vote/route.ts` | 修改 | 加 `auth()` 401 校验 + Redis userId 投票记录 |
| `app/api/votes/route.ts` | 修改 | 已登录时批量拉取用户 `myVote` 状态 |
| `hooks/useVotes.ts` | 修改 | 返回类型扩展 `myVote?: 'up' \| 'down' \| null` |
| `components/VoteBar.tsx` | 修改 | 删除 localStorage，未登录点击弹 Modal |

---

## Redis 数据结构

```
# 现有（不变）
Key:   votes:{date}:{id}
Type:  Hash
Fields: up (string int), down (string int)

# 新增
Key:   voted:{userId}:{date}:{id}
Type:  String
Value: "up" | "down"
TTL:   无（永久保留）
```

旧的 localStorage 方案废弃，不做历史数据迁移（旧 aggregate 计数保留）。

---

## API 设计

### POST /api/vote（修改）

```
Headers: Clerk session cookie（自动）
Body:    { date: "2026-05-26", id: 3, type: "up" | "down" }

401  未登录
409  { error: "已投票" }（voted:{userId}:{date}:{id} 已存在）
400  { error: "参数错误" }
200  { up: 33, down: 8 }
```

实现：
1. `const { userId } = auth()` — 无 userId 返回 401
2. `await kv.get('voted:{userId}:{date}:{id}')` — 存在返回 409
3. `await kv.hincrby('votes:{date}:{id}', type, 1)`
4. `await kv.set('voted:{userId}:{date}:{id}', type)`
5. `await kv.hgetall('votes:{date}:{id}')` — 返回最新计数

### GET /api/votes（修改）

```
Query:  ?date=2026-05-26&ids=1,2,3,4,5
成功:   200  {
  "1": { up: 12, down: 2, myVote: "up" },
  "3": { up: 33, down: 8, myVote: null },
  ...
}
```

实现：
1. Pipeline HGETALL × N（现有逻辑）
2. `const { userId } = auth()` — 若存在，Pipeline GET `voted:{userId}:{date}:{id}` × N
3. 合并结果：`myVote` 为 "up" | "down" | null

---

## 组件设计

### Header.tsx

```tsx
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

// 在 Header 右侧导航区：
<SignedOut>
  <SignInButton mode="modal">
    <button className="...">登录</button>
  </SignInButton>
</SignedOut>
<SignedIn>
  <UserButton />
</SignedIn>
```

### VoteBar.tsx（修改）

Props 新增：`myVote?: 'up' | 'down' | null`（从 useVotes 传入）

行为变化：
- **删除** 所有 localStorage 读写代码
- **初始化** `voted` state 从 `myVote` prop（而非 localStorage）
- **未登录点击**：`useClerk().openSignIn()` 弹 Modal，不发请求
- 其余乐观更新 / 回滚逻辑不变

```tsx
import { useClerk, useUser } from '@clerk/nextjs'

const { isSignedIn } = useUser()
const { openSignIn } = useClerk()

async function handleVote(type: 'up' | 'down') {
  if (!isSignedIn) { openSignIn(); return }
  if (voted || loading) return
  // ... 现有乐观更新逻辑
}
```

### useVotes.ts（修改）

```ts
export type VoteCounts = { up: number; down: number; myVote?: 'up' | 'down' | null }
// 返回类型 Record<number, VoteCounts>（接口不变，字段扩展）
```

---

## 环境变量

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

配置位置：
- 本地：`.env.local`
- 生产：Vercel Dashboard → Settings → Environment Variables

Clerk 控制台需配置：
- Google OAuth：在 Clerk Dashboard → Social connections → Google 开启
- 邮箱 OTP：默认已开启
- Allowed origins：`https://opradar.indevs.in`、`http://localhost:3001`

---

## 依赖

```bash
npm install @clerk/nextjs
```

---

## 错误处理

| 场景 | 处理 |
|------|------|
| 未登录点击投票 | 弹 Clerk 登录 Modal |
| 已投票再次点击 | 409，前端保持已投状态（不 alert） |
| Clerk 服务不可用 | `auth()` 返回 null，API 返回 401，前端弹 Modal |
| `CLERK_SECRET_KEY` 未配置 | 构建失败，Vercel 部署前检查 |

---

## 不在范围内

- 用户个人资料页
- 收藏 / 书签功能
- Pro 订阅 / 付费墙
- 用户投票历史展示页
