// app/api/generate-prd/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'
import { DAILY_LIMIT, PrdEntry, quotaKey, historyKey } from '@/lib/prd'
import type { Opportunity } from '@/lib/opportunities'

function buildPrompt(o: Opportunity, customPrompt?: string): string {
  return `你是一位经验丰富的产品经理，请根据以下市场机会，生成一份结构清晰的中文 PRD（产品需求文档），用于指导独立开发者快速启动项目。

## 机会信息
**标题**：${o.title}
**分类**：${o.category}
**标签**：${o.tags.join('、')}
**摘要**：${o.summary}
**详细描述**：${o.description}
**核心痛点**：${o.painPoint}
**执行路径参考**：${o.path.join(' → ')}
**商业模式**：${o.revenueModel}
**预计回收周期**：${o.timeToRevenue}
**启动成本**：${o.startupCost}
${customPrompt ? `\n## 开发者背景偏好\n${customPrompt}\n\n请根据以上背景定制 PRD，使建议更贴合开发者实际情况。` : ''}

请按以下格式输出完整 PRD（Markdown 格式）：

## 机会背景
（2-3句话说明这个机会的背景和时效性）

## 目标用户
（主要用户群体、次要用户群体及各自痛点）

## 核心功能（MVP 范围）
（3-5个 MVP 核心功能，每个功能一句话描述，聚焦最小可行版本）

## 技术建议
（推荐技术栈、核心技术难点、预计开发工时估算）

## 商业化思路
（收费方式、定价区间建议、增长策略）

## 第一步行动
（本周内可以立即执行的3个具体行动，格式为编号列表）

只输出 Markdown 内容，不要有任何额外说明。`
}

interface DeepSeekResponse {
  choices: Array<{ message: { content: string } }>
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    let body: { opportunity: Opportunity; customPrompt?: string; userApiKey?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
    }
    const { opportunity, customPrompt, userApiKey } = body

    if (!opportunity || typeof opportunity.id !== 'number') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    // Atomic quota check — incr first, then check
    const countKey = quotaKey(userId)
    const newCount = await kv.incr(countKey)
    if (newCount > DAILY_LIMIT) {
      await kv.decr(countKey) // put it back
      return NextResponse.json(
        { error: `今日生成次数已用完（${DAILY_LIMIT}/${DAILY_LIMIT}），明日重置` },
        { status: 429 },
      )
    }
    // Set TTL only on first use today
    if (newCount === 1) {
      await kv.expire(countKey, 48 * 3600)
    }

    // Choose API key
    const apiKey = userApiKey?.trim() || process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      await kv.decr(countKey)
      return NextResponse.json({ error: '缺少 API Key' }, { status: 500 })
    }

    // Call DeepSeek — roll back quota on any downstream failure
    let content: string
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      let dsRes: Response
      try {
        dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-v4-flash',
            max_tokens: 2048,
            messages: [{ role: 'user', content: buildPrompt(opportunity, customPrompt) }],
          }),
          signal: controller.signal,
        })
      } catch (fetchErr: unknown) {
        if ((fetchErr as { name?: string })?.name === 'AbortError') {
          return NextResponse.json({ error: '文档整理超时，请稍后重试' }, { status: 504 })
        }
        throw fetchErr
      } finally {
        clearTimeout(timeoutId)
      }

      if (!dsRes.ok) {
        // Do not log errText — it may contain auth context from DeepSeek's response
        console.error('DeepSeek error status:', dsRes.status)
        return NextResponse.json({ error: '文档整理失败，请稍后重试' }, { status: 502 })
      }

      const dsJson = await dsRes.json() as DeepSeekResponse
      content = dsJson.choices?.[0]?.message?.content ?? ''
      if (!content) {
        return NextResponse.json({ error: '返回内容为空，请稍后重试' }, { status: 502 })
      }

      // Save to history (prepend, keep latest 50)
      const hKey = historyKey(userId)
      const existingHistory = (await kv.get<PrdEntry[]>(hKey)) ?? []
      const entry: PrdEntry = {
        id: Date.now().toString(),
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        createdAt: new Date().toISOString(),
        content,
        isCustom: !!userApiKey?.trim(),
      }
      await kv.set(hKey, [entry, ...existingHistory].slice(0, 50))
    } catch (err) {
      // Roll back the quota slot so the user is not charged for a failed generation
      await kv.decr(countKey)
      console.error('generate-prd downstream error:', (err as Error)?.message ?? 'unknown')
      return NextResponse.json({ error: '服务器错误' }, { status: 500 })
    }

    return NextResponse.json({
      content,
      remaining: Math.max(0, DAILY_LIMIT - newCount),
    })
  } catch (err) {
    console.error('generate-prd error:', (err as Error)?.message ?? 'unknown')
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
