# 今日技术风口独立页面设计文档

**日期**：2026-05-26  
**状态**：已确认，待实现

---

## 概述

将现有嵌入在 `[date]/page.tsx` 中的「今日技术风口」区块（`TechSignals` 组件）剥离为独立页面 `/trends/[date]`，路由结构与每日机会页对称，支持 SSG 和历史日期浏览。

---

## 路由结构

| 路径 | 类型 | 说明 |
|------|------|------|
| `/trends` | Server Component (redirect) | 重定向到最新日期 `/trends/[latest]` |
| `/trends/[date]` | Server Component (SSG) | 技术风口主页面，`generateStaticParams` 覆盖所有已有日期 |

---

## 页面内容

`/trends/[date]` 页面从上到下：

1. **DateNav** — 日期切换条，复用现有组件；新增 `basePath` prop，传入 `"/trends"` 使链接生成 `/trends/[date]`
2. **TechSignals** — 现有组件零改动，传入 `staticRepos={data.trending}`
3. **底部版权行** — 与每日机会页相同的 monospace 小字

---

## 组件改动

### `components/DateNav.tsx`
新增可选 prop `basePath?: string`（默认 `""`）。  
将 `href={`/${date}`}` 改为 `href={`${basePath}/${date}`}`。

### `components/NavBar.tsx`
在 `NAV_ITEMS` 数组追加：
```ts
{ href: '/trends', label: '技术风口', match: (p) => p.startsWith('/trends') }
```

### `app/[date]/page.tsx`
删除 `TechSignals` 的 import 和渲染（`<TechSignals staticRepos={data.trending} />`）。

---

## 新建文件

### `app/trends/page.tsx`
服务端组件，调用 `getLatestDate()` 后 `redirect('/trends/[latest]')`。  
若无数据则 `notFound()`。

### `app/trends/[date]/page.tsx`
与 `app/[date]/page.tsx` 结构对称：
- `generateStaticParams()` — 复用 `getAllDates()`
- `generateMetadata()` — title: `{date} 技术风口 · 见微 Prowl`
- 页面渲染：`DateNav`（basePath="/trends"）+ `TechSignals`（staticRepos）+ 版权行

---

## 数据来源

不引入新数据或新接口。完全使用现有 `getOpportunities(date).trending` 字段。

---

## 约束

- 零新依赖
- SSG 兼容：所有数据在 build time 从 JSON 读取
- `TechSignals` 组件本身不修改
- 不破坏现有每日机会页的路由和功能（仅删除其中的 TechSignals 渲染）

---

## 不在本次范围内

- 跨日期的趋势聚合（多日 trending 对比）
- 技术信号来源扩展（HN、PH 技术讨论等）
- 筛选/搜索功能
- 技术标签与机会的关联跳转
