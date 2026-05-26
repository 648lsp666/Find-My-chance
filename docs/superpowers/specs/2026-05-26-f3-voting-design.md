# F3 机会投票设计文档

**日期：** 2026-05-26  
**状态：** 已确认，待实施  
**目标：** 为每条机会卡片添加 👍/👎 投票，结果写入 Upstash Redis，实时展示计数

---

## 问题陈述

当前机会卡片无用户反馈机制，无法判断 AI 生成内容的质量，也无法为后续 prompt 调优提供数据支撑。

---

## 架构概览

```
用户点击 👍/👎
  → 乐观更新：UI 立即 +1，按钮高亮
  → POST /api/vote { date, id, type: 'up'|'down' }
  → Upstash Redis: HINCRBY votes:{date}:{id} up/down 1
  → 返回最新计数 { up, down }
  → 失败时 UI 回滚，提示错误

页面加载
  → useEffect: GET /api/votes?date=X&ids=1,2,3...
  → Redis Pipeline: HGETALL votes:{date}:{id} × N
  → 返回 { [id]: { up, down } }
  → 各卡片渲染计数，localStorage 还原已投状态
```

---

## 新增 / 修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `app/api/vote/route.ts` | 新增 | POST 投票，写 Redis |
| `app/api/votes/route.ts` | 新增 | GET 批量读计数 |
| `hooks/useVotes.ts` | 新增 | 客户端数据拉取 + 状态管理 |
| `components/VoteBar.tsx` | 新增 | 彩色胶囊按钮组件 |
| `components/OpportunityCard.tsx` | 修改 | 底部插入 `<VoteBar>` |
| `lib/kv.ts` | 新增 | Redis 客户端单例 |

---

## Redis 数据结构

```
Key:   votes:{date}:{id}
Type:  Hash
Fields: up (string int), down (string int)

例：votes:2026-05-26:3 → { up: "33", down: "8" }
```

无 TTL（永久保留，数据量极小：每天最多 10 条 × 每条 2 个字段）。

---

## API 设计

### POST /api/vote

```
Body:    { date: "2026-05-26", id: 3, type: "up" | "down" }
成功:    200  { up: 33, down: 8 }
参数错误: 400  { error: "..." }
```

实现：`HINCRBY votes:{date}:{id} {type} 1`，再 `HGETALL` 返回最新值。

### GET /api/votes

```
Query:  ?date=2026-05-26&ids=1,2,3,4,5,6,7
成功:   200  { "1": { up: 12, down: 2 }, "3": { up: 33, down: 8 }, ... }
```

实现：Redis Pipeline 批量 `HGETALL`，合并结果返回。不存在的 id 返回 `{ up: 0, down: 0 }`。

---

## 组件设计

### `VoteBar.tsx`（`'use client'`）

Props：`{ date: string; opportunityId: number; initialCounts?: { up: number; down: number } }`

状态：
- `counts: { up, down }` — 初始为 `{ up: 0, down: 0 }`，`useVotes` 注水后更新
- `voted: 'up' | 'down' | null` — 从 `localStorage` 读取初始值

渲染：
- **未投票**：两个彩色胶囊按钮，显示当前计数（0 时不显示数字）
- **已投 up**：👍 绿色高亮 + 数字；👎 灰色 + disabled
- **已投 down**：👎 红色高亮 + 数字；👍 灰色 + disabled

```tsx
// 彩色胶囊样式
<button style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', padding: '7px 16px' }}>
  👍 {counts.up || ''}
</button>
<button style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '20px', padding: '7px 16px' }}>
  👎 {counts.down || ''}
</button>
```

乐观更新流程：
1. 本地 `counts` +1、`voted` 设为所选类型、写 `localStorage`
2. `POST /api/vote`
3. 成功：用服务端返回值更新 `counts`（避免与其他用户并发差异）
4. 失败：回滚 `counts`、清除 `voted`、清除 `localStorage`、`alert('投票失败，请稍后再试')`

### `useVotes(date, ids)`

```ts
// 返回 Record<number, { up: number; down: number }>
```

**调用位置：** `OpportunityList` 组件（`'use client'`）。它拿到所有机会的 id 列表，调用 `useVotes(date, ids)`，把 `counts[opp.id]` 作为 `initialCounts` prop 传给每个 `VoteBar`。

`VoteBar` 收到 `initialCounts` 后初始化本地 `counts` state，后续的乐观更新在 `VoteBar` 内部维护，不回写到 `useVotes`。

单次 fetch，错误静默（counts 保持 0），不 retry。

### `lib/kv.ts`

```ts
import { Redis } from '@upstash/redis'
export const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
```

---

## localStorage 结构

```
Key:   voted:{date}:{id}
Value: "up" | "down"
```

页面加载时读取，初始化 `VoteBar` 的 `voted` 状态。账号系统上线后替换为服务端记录。

---

## 错误处理

| 场景 | 处理 |
|------|------|
| `KV_REST_API_URL` 未配置 | API 返回 503，`useVotes` 静默跳过，按钮可用但无计数 |
| POST 投票失败 | 乐观更新回滚，不写 localStorage，alert 提示 |
| GET 批量读取失败 | counts 保持 0，不影响投票功能 |
| localStorage 已有记录 | 前端拦截，不发请求，按钮直接显示已投状态 |

---

## 依赖

```bash
npm install @upstash/redis
```

环境变量（已在 `.env.local` 配置，Vercel 自动注入）：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

---

## 不在范围内

- IP 限制（待账号系统上线后做账号级别限制）
- 投票数据后台分析（后续迭代）
- 投票百分比展示（当前展示原始计数，后续可迭代）
- 取消投票 / 改票
