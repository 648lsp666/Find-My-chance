# F5 CCR Prompt 精调设计文档

**日期：** 2026-05-26  
**状态：** 已确认，待实施  
**目标：** 解决机会重复（A）和内容太虚（B）两个核心质量问题，同时新增 IndieHackers 信号源

---

## 问题陈述

当前 `scripts/generate-daily.ts` 存在两个主要质量缺陷：

1. **重复**：同一 category 下相似主题的机会在数天内反复出现
2. **太虚**：执行路径缺乏具体佐证，AI 描述停留在概念层，无真实数据支撑

---

## 架构概览

脚本执行流程从单阶段改为三阶段：

```
阶段 1 — 抓取信号
  HN + GitHub + Product Hunt + 36kr + IndieHackers（新）
  → 约 55 条原始信号

阶段 2 — 生成（Pass 1）
  + 注入最近 14 天历史机会摘要（title + category）
  + prompt 新增 evidence 字段要求
  → LLM 输出 8-10 条草稿机会（多生成 2 条作为质检缓冲）

阶段 3 — 质检（Pass 2）
  + 草稿机会 + 14 天历史喂给 LLM
  + 去重打分、佐证核查、裁剪至 6-8 条
  → 最终写入 JSON
```

**成本：** 两次 DeepSeek V4 Flash 调用，约 $0.01/天。

---

## 信号层

### 新增：IndieHackers Fetcher

使用社区维护的非官方 RSS `https://ihrss.io/`，解析方式与现有 36kr fetcher 相同（正则提取 `<item>` 块），抓取最近 10 条帖子。失败时 `Promise.allSettled` 静默跳过。

### 信号源汇总

| 来源 | 数量 | 特点 |
|------|------|------|
| Hacker News | 15 | Show HN + front_page |
| GitHub | 10 | 技术趋势 |
| Product Hunt | 10 | 新产品发布 |
| 36kr | 10 | 中文商业资讯 |
| IndieHackers（新）| 10 | 海外独立开发者真实案例 |

---

## Prompt 设计

### Pass 1：生成草稿

**新增 1 — 去重 Context**

脚本启动时读取 `data/opportunities/` 最近 14 天 JSON，提取每条的 `title + category`，拼为精简列表注入 prompt：

```
【近14天已生成的机会（避免重复）】
- [AI应用] 用 AI 帮中小企业做账
- [SaaS工具] GitHub Copilot 替代品
...

严格要求：category 相同且主题高度相似的机会不得重复出现。
```

Token 估算：14天 × 7条 × ~20 tokens ≈ 2000 tokens，可接受。

**新增 2 — evidence 字段**

JSON schema 新增必填字段：

```json
"evidence": "直接引用信号中的具体数字或案例，例如：'该 GitHub 仓库 3 天内获得 2400 star'"
```

prompt 严格要求：

```
5. evidence 必须引用上方信号列表中的真实数据（数字、用户量、涨幅等），
   不允许使用模糊表达如"市场需求旺盛"
```

生成数量从 6-8 条改为 **8-10 条**，为 Pass 2 提供裁剪缓冲。

### Pass 2：质检

单独一次 LLM 调用，输入草稿机会 + 14 天历史：

```
你是质检员。以下是今天生成的草稿机会（8-10条）和近14天历史。

任务：
1. 标记与历史 category+主题重复的条目（重复度 > 70%）
2. 标记 evidence 字段模糊（无具体数字）的条目
3. 删除标记条目，从剩余中保留评分最高的 6-8 条
4. 只返回最终 JSON，格式与输入相同
```

---

## 错误处理

| 场景 | 处理策略 |
|------|---------|
| 历史文件不足 14 天 | 有多少读多少，去重 context 为空字符串，正常运行 |
| Pass 2 JSON 解析失败 | 降级使用 Pass 1 结果（取前 6-8 条），打印 `⚠ Pass 2 failed, using Pass 1 output` |
| IndieHackers RSS 不可用 | `Promise.allSettled` 静默跳过，打印警告，不影响其他源 |
| Pass 2 过滤后机会数 < 6 | 直接使用 Pass 1 全量输出，打印警告 |

**核心原则：Pass 2 是增强，不是依赖。任何异常均降级到 Pass 1，保证每天必定生成。**

---

## 实施范围

仅修改 `scripts/generate-daily.ts`，不涉及前端组件、数据结构（JSON schema 新增 `evidence` 字段，前端可选渲染）、GitHub Actions workflow。

---

## 不在范围内

- Twitter/X 信号源（官方 API $100/月，暂不引入）
- 阮一峰周刊（每周五发布，频率与每日生成不匹配）
- 本地语义去重（NLP 依赖过重）
- 前端展示 `evidence` 字段（后续单独迭代）
