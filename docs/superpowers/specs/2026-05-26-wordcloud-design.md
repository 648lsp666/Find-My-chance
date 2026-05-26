# 词云功能设计文档

**日期**：2026-05-26  
**状态**：已确认，待实现

---

## 概述

在 DailyBrief 卡片内嵌入一个纯 CSS 词云，聚合当日机会的 `tags[]` 字段，可视化展示今日热词分布，并支持点击过滤下方机会列表。

---

## 位置与布局

- **位置**：`DailyBrief` 组件内，AI 摘要文字下方，独立区块
- **标题**：monospace 小标题 `今日热词 · 点击过滤，再次点击取消`
- **布局**：`display: flex; flex-wrap: wrap; justify-content: center`，每个词通过硬编码不同的 `margin-top` 制造垂直错落感，无旋转

---

## 数据

**来源**：当天 `DayData.opportunities[].tags[]` 全部展开后统计频次

**字号映射**（按频次降序）：

| 频次 | 字号 | 颜色 |
|------|------|------|
| 最高（≥4） | 27px, 800 | `#7C3AED` |
| 高（3） | 19px, 700 | `#5B21B6` |
| 中（2） | 13px, 400 | `#6D28D9` |
| 低（1） | 10px, 400 | `#C4B5FD` |

实现时按频次对 tags 排序，取 top ~15 个展示，避免词云过长。

**数量显示**：上标数字，颜色用 `#A78BFA`（比词本身浅一档）

---

## 交互

- **点击 tag**：选中高亮（词本身加下划线或加深色），触发 `OpportunityList` 过滤，只显示 `tags` 包含该词的机会
- **再次点击**：取消过滤，恢复全部显示
- **状态传递**：通过 React state `selectedTag: string | null`，在 `[date]/page.tsx` 层持有，向下传给 `DailyBrief`（展示/交互）和 `OpportunityList`（过滤）
- **不修改 URL**：client-side state 即可，无需持久化

---

## 组件改动

| 文件 | 改动 |
|------|------|
| `app/[date]/page.tsx` | 添加 `selectedTag` state，传给两个子组件 |
| `components/DailyBrief.tsx` | 接收 `opportunities`、`selectedTag`、`onTagSelect`；新增词云区块 |
| `components/OpportunityList.tsx` | 接收 `selectedTag`，在现有 category filter 基础上额外过滤 tag |
| `lib/opportunities.ts` | 无需改动（tags 已在 `Opportunity` 类型中） |

---

## 约束

- 纯 CSS，零新依赖
- 不破坏现有 category filter 逻辑（tag filter 独立叠加）
- SSG 兼容：词云数据在 build time 从 JSON 计算，组件本身是 client component（已有 `'use client'`）
- 移动端：flex wrap 自然换行，错落感在小屏仍有效

---

## 不在本次范围内

- 词云动画（进入动效）
- 多 tag 同时选中
- tag 过滤与 category filter 联动（目前相互独立）
