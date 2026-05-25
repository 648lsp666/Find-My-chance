# 每日机会雷达 UI 全面重设计

Date: 2026-05-25  
Status: Approved

---

## 目标

解决三个核心问题：颜色太深难阅读、字号太小伤眼、时间维度筛选缺失。整体升级为亮色现代风格，增加变现周期筛选功能，提升交互反馈质量。

---

## 配色方案

从深色系（`#0B0B12` 背景）全面切换为亮色系：

| Token | 旧值 | 新值 | 用途 |
|---|---|---|---|
| `r.bg` | `#0B0B12` | `#F5F4FF` | 页面背景（淡紫白） |
| `r.card` | `#111120` | `#FFFFFF` | 卡片背景 |
| `r.border` | `#1C1C30` | `#E5E3F5` | 边框 |
| `r.text` | `#E8E6F0` | `#1E1B4B` | 主文字 |
| `r.muted` | `#5A5A78` | `#6B7280` | 次要文字 |
| `r.faint` | `#9090A8` | `#9CA3AF` | 弱化文字 |
| `r.accent` | `#E8A020` | `#7C3AED` | 主色调（紫色） |
| `r.dim` | `#252540` | `#C4B5FD` | 浅紫（hover 边框等） |
| 新增 `r.accent-hover` | — | `#6D28D9` | accent hover 色 |
| 新增 `r.time` | — | `#0D9488` | 变现周期主色（青绿） |

---

## 组件变更

### Header.tsx

- 背景：`white/92%` + `backdrop-blur-md`，下边框 `r.border`
- 品牌图标：紫色渐变方块，增加 `box-shadow`
- 订阅按钮：实色紫色圆角按钮（替换原来的 SubscribeForm 输入框展示方式，保留功能组件）
- 时钟：紫色 `r.accent`，字号 14px（原来偏小）

### DateNav.tsx

结构从「横向滚动小卡片」改为「标签页（tab）样式」：
- 整个 DateNav 有独立白色背景 + 下边框
- 每个日期项：竖排（月份标签 + 日期数字），下划线激活态
- 当前日期：紫色下边框 + 紫色圆点
- hover：背景变浅紫 `#F5F4FF`

### OpportunityList.tsx（核心变更）

**新增变现周期筛选逻辑：**

新增 `getTimeBucket(timeToRevenue: string): '1mo' | '1-3mo' | '3mo+'` 工具函数：
- 含"周" → `1mo`（1个月内）
- 首个数字 ≤ 1 且含"个月" → `1mo`
- 首个数字 2-3 → `1-3mo`
- 其余 → `3mo+`

筛选区分两行：
1. **类别行**：`全部 / AI应用 / 自媒体 / SaaS工具 / ...`（原有逻辑保留）
2. **变现周期行**：`不限 / ⚡ 1个月内 / 🚀 1-3个月 / 📈 3个月+`

筛选结果同时满足两个维度（AND 逻辑）。

`Chip` 样式（共用）：
- 默认：白底，`r.border` 边框，灰色文字
- hover：边框变浅紫，文字变紫，微上浮 translateY(-1px)
- active（类别）：紫色背景 + 白字 + 阴影
- active（周期）：青绿色背景 + 白字 + 阴影

### OpportunityCard.tsx

**卡片头部（新增 `card-header`）**：
- 独立区域，彩色渐变背景（基于 category 色）
- 展示：类别 badge、市场 badge、**变现周期 badge**（青绿色）、潜力点阵
- 变现周期 badge 直接读 `o.timeToRevenue` 字段，无需解析

**卡片主体字号全面上调**：
- 标题：19px → 保持，但 font-weight 800
- 正文描述：13px → 14px
- 标签 badge：9px → 11px
- 统计标签：8px → 10px
- 统计值：13px → 14px

**交互反馈**：
- hover：border 变浅紫 + 上浮 2px + 紫色阴影
- 点阵填充色：跟随 category 色（保留原逻辑）
- 执行路径数字圆点：`r.accent/10` 背景 + `r.accent` 文字

**今日简报卡片（在 `[date]/page.tsx`）**：
- 从普通边框卡片改为紫色渐变横幅
- 背景：`linear-gradient(135deg, #7C3AED, #5B21B6)`，白色文字
- 加伪元素大号 `⌖` 装饰（低透明度）

---

## 字体与间距

- `globals.css` body 背景改为 `#F5F4FF`，去掉点阵 pattern（在亮色下视觉噪音）
- 主内容区宽度：`max-w-3xl` → `max-w-4xl`（减少两侧留白）
- 卡片内 padding：保持 `pl-6 pr-5 pt-5 pb-5`，但移除 ghost 序号（在亮色下显眼度下降，去掉）

---

## 文件改动范围

| 文件 | 改动类型 |
|---|---|
| `tailwind.config.ts` | 更新 `r.*` 色值，新增 `r.time` |
| `app/globals.css` | 更新 body 背景色，移除点阵 pattern |
| `components/Header.tsx` | 视觉重写 |
| `components/DateNav.tsx` | 结构 + 视觉重写（tab 样式） |
| `components/OpportunityList.tsx` | 新增时间桶逻辑 + 筛选 UI 重写 |
| `components/OpportunityCard.tsx` | 新增卡片头部 + 字号/颜色更新 |
| `app/[date]/page.tsx` | 简报改为渐变横幅 |

共 7 个文件，无后端/数据改动。

`components/SubscribeForm.tsx` 无需显式修改——全部使用 `r-*` Tailwind token，随 `tailwind.config.ts` 颜色更新自动继承新主题。
