export interface GenerationSignal {
  source: string
  title: string
  url: string
  description?: string
  score?: number
}

interface ReportInput {
  date: string
  signals: GenerationSignal[]
  historyTitles?: string[]
}

const categories = [
  { category: '自动化流程', words: ['automat', 'workflow', 'agent', '自动化', '工作流'] },
  { category: 'AI应用', words: ['ai', 'llm', 'model', 'gpt', '智能', '模型'] },
  { category: '开发工具', words: ['developer', 'api', 'code', 'github', 'debug', '开发', '代码'] },
  { category: '数据服务', words: ['data', 'search', 'analytics', 'knowledge', '数据', '搜索', '知识'] },
  { category: '内容创作', words: ['video', 'image', 'markdown', 'content', '视频', '图片', '内容'] },
]

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ').trim()
}

function categoryFor(signal: GenerationSignal) {
  const text = normalized(`${signal.title} ${signal.description ?? ''}`)
  return categories.find(item => item.words.some(word => text.includes(word)))?.category ?? 'SaaS工具'
}

function signalScore(signal: GenerationSignal) {
  const sourceWeight: Record<string, number> = {
    'Hacker News': 40,
    'Product Hunt': 35,
    GitHub: 30,
    少数派: 25,
    V2EX: 20,
    IndieHackers: 20,
    '36kr': 20,
  }
  const completeness = signal.description ? 10 : 0
  return (signal.score ?? 0) + (sourceWeight[signal.source] ?? 10) + completeness
}

function isDuplicate(title: string, historyTitles: string[]) {
  const candidate = normalized(title)
  return historyTitles.some(history => {
    const previous = normalized(history)
    return candidate === previous || candidate.includes(previous) || previous.includes(candidate)
  })
}

function shortTitle(title: string) {
  return title.split(/[:：|–—-]/)[0].trim().slice(0, 20)
}

export function generateDeterministicReport({ date, signals, historyTitles = [] }: ReportInput) {
  const selected = signals
    .filter(signal => /^https?:\/\//.test(signal.url))
    .filter(signal => !isDuplicate(signal.title, historyTitles))
    .sort((a, b) => signalScore(b) - signalScore(a))
    .slice(0, 3)

  const opportunities = selected.map((signal, index) => {
    const category = categoryFor(signal)
    const title = shortTitle(signal.title)
    const heat = signal.score === undefined ? '未提供量化热度' : `公开热度为 ${signal.score}`
    return {
      id: index + 1,
      title,
      category,
      market: '国内外均可验证',
      tags: [category, signal.source, '待验证'],
      summary: `围绕“${title}”验证可收费的小型服务`,
      description: `${signal.source} 出现了“${signal.title}”这一公开信号。该信号只能说明相关主题受到关注，尚不能证明用户愿意付费；建议先用访谈或手工服务验证。`,
      painPoint: `目标用户可能需要更省时地处理与“${title}”相关的工作`,
      stage: '待验证' as const,
      targetCustomer: `正在公开讨论或使用相关方案的 ${signal.source} 用户`,
      reachChannel: `从来源页面及相关社区筛选并联系前 10 位活跃用户`,
      facts: [`${signal.source} 出现相关公开信号`, heat],
      assumptions: ['目标用户存在可量化的时间或成本损失', '至少部分用户愿意为更省时的方案付费'],
      validationWindow: '48–72小时',
      validationBudget: '≤500元',
      validationPlan: ['整理一页服务说明或样例', '联系10位具体潜在用户', '提出明确测试价格并索取订金或书面承诺'],
      path: ['整理一页服务说明或样例', '联系10位具体潜在用户', '提出明确测试价格并索取订金或书面承诺'],
      successCriteria: '10位有效沟通对象中至少3位愿意继续试用，且至少1位接受付费测试',
      stopCondition: '联系20位目标用户后仍无人愿意访谈，或10次访谈均否认该问题',
      pricingHypothesis: '首轮测试价99–499元，按节省的一次人工服务时间校准',
      revenueModel: '按次服务或小额订阅，价格尚待验证',
      timeToRevenue: '48–72小时验证',
      startupCost: '≤500元',
      risks: ['公开热度不等于真实付费需求'],
      confidence: Math.max(1, Math.min(5, Math.ceil(signalScore(signal) / 100))),
      difficulty: category === '开发工具' || category === 'AI应用' ? 3 : 2,
      potential: Math.max(2, Math.min(10, Math.ceil(signalScore(signal) / 50))),
      competition: '未知，待验证',
      evidence: `${signal.source} 的公开页面提供了该主题的真实信号；当前证据仅支持关注度，不支持收入判断。`,
      sources: [{ title: signal.title, url: signal.url }],
    }
  })

  return {
    date,
    generatedAt: new Date().toISOString(),
    summary: opportunities.length
      ? `今日从公开信号中按来源质量、热度和可验证性筛选出 ${opportunities.length} 个待验证方向。所有方向均需先确认付费意愿。`
      : '今日没有筛选出符合条件且未与近期历史重复的机会。',
    opportunities,
  }
}
