# 见微 Prowl · AI 副业机会雷达

> 每天用 AI 扫描真实市场信号，为独立开发者和个人创业者精选可落地的副业机会。

**[opradar.indevs.in](https://opradar.indevs.in)** · 免费使用 · 无需注册

---

## 它是什么

见微每天自动抓取来自 Hacker News、GitHub、Product Hunt、36氪、IndieHackers 的最新动态，交由 AI 分析后生成 6–8 个面向**1 人独立执行**的副业机会，并在当天发布到网站。

每个机会包含：

- **市场分析** — 规模估算、竞品现状、差异化切入点
- **核心痛点** — 目标用户的真实诉求
- **执行路径** — 4 步可操作计划
- **收益模式** — 具体定价策略与预估月收入
- **关键指标** — 启动成本、回收周期、竞争程度、执行难度
- **信号来源** — 触发该机会的真实市场 URL，可追溯可验证

---

## 功能一览

| 功能 | 说明 |
|---|---|
| 📡 **每日信号聚合** | 同时拉取 HN / GitHub / Product Hunt / 36氪 / IndieHackers |
| 🤖 **两轮 AI 筛选** | 第一轮生成草稿，第二轮质检去重、淘汰低质条目 |
| 📈 **今日技术风口** | 显示驱动当天机会的 GitHub 趋势项目 |
| 👍 **帮助度投票** | 登录后可对每个机会点赞 / 踩，帮助打磨内容质量 |
| 📬 **邮件日报订阅** | 每天将精选机会推送至邮箱（由 Resend 驱动） |
| 📅 **历史日历导航** | 随时回溯任意日期的机会列表 |
| 🔗 **Open Graph 分享图** | 每个机会均生成独立封面图，适合社交媒体传播 |

---

## 技术栈

```
Next.js 14 (App Router)   前端框架
TypeScript                 类型安全
Tailwind CSS              样式
Clerk                     用户认证
Upstash Redis             投票计数 / 订阅状态
Resend                    邮件发送
DeepSeek API              AI 机会生成 (deepseek-v4-flash)
Vercel                    部署托管
```

---

## 本地运行

**环境要求：** Node.js 18+

```bash
# 克隆仓库
git clone https://github.com/648lsp666/Find-My-chance.git
cd Find-My-chance

# 安装依赖
npm install

# 配置环境变量（参考下方说明）
cp .env.local.example .env.local

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 环境变量

在 `.env.local` 中填写以下变量：

```env
# DeepSeek AI（必填）
DEEPSEEK_API_KEY=

# Upstash Redis（必填，用于投票和订阅）
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Clerk 认证（必填）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Resend 邮件（订阅功能需要）
RESEND_API_KEY=

# 可选
GITHUB_TOKEN=          # 提升 GitHub API 限速上限
PRODUCT_HUNT_TOKEN=    # 抓取 Product Hunt 数据
```

---

## 生成当日机会

```bash
# 生成今天的机会数据（已有则跳过）
npm run generate

# 强制重新生成（覆盖已有文件）
npm run generate:force
```

脚本会：
1. 并发拉取 HN / GitHub / Product Hunt / 36氪 / IndieHackers 信号
2. 加载近 14 天历史，用于去重上下文
3. 调用 DeepSeek 生成 8–10 条机会草稿（Pass 1）
4. 再次调用 DeepSeek 执行质检，过滤重复或证据模糊条目（Pass 2）
5. 将结果写入 `data/opportunities/YYYY-MM-DD.json`

---

## 数据格式

每个日期文件保存在 `data/opportunities/` 目录下：

```json
{
  "date": "2026-05-26",
  "generatedAt": "2026-05-26T10:00:00.000Z",
  "summary": "今日整体信号摘要",
  "opportunities": [
    {
      "id": 1,
      "title": "机会标题",
      "category": "AI应用",
      "market": "国内为主",
      "tags": ["标签"],
      "summary": "一句话概括",
      "description": "详细分析...",
      "painPoint": "核心痛点",
      "path": ["第一步", "第二步", "第三步", "第四步"],
      "revenueModel": "月收入预估",
      "timeToRevenue": "2个月",
      "startupCost": "< 500元",
      "difficulty": 3,
      "potential": 7,
      "competition": "低",
      "sources": [{ "title": "来源描述", "url": "真实信号 URL" }]
    }
  ],
  "trending": [...]
}
```

机会类别固定为 6 种：`AI应用` / `SaaS工具` / `自媒体` / `整活玩具` / `本地服务` / `内容创作`

---

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/648lsp666/Find-My-chance)

1. 在 Vercel 控制台添加上述环境变量
2. 配置一个每日 Cron Job 触发 `/api/send-digest`（可选，用于发送邮件日报）

---

## License

MIT
