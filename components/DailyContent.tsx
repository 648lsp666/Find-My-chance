'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { DayData, Opportunity } from '@/lib/opportunities'
import DailyBrief from './DailyBrief'
import OpportunityList from './OpportunityList'

interface Props {
  data: DayData
  date: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI应用': '#7C3AED',
  '自媒体': '#8B5CF6',
  'SaaS工具': '#059669',
  '整活玩具': '#DC2626',
  '本地服务': '#D97706',
  '内容创作': '#EA580C',
  '开发工具': '#2563EB',
  '数据服务': '#0D9488',
  '自动化流程': '#0891B2',
  '教育培训': '#9333EA',
  '企业服务': '#4F46E5',
  '出海产品': '#DB2777',
}

function getAverage(items: Opportunity[], key: 'difficulty' | 'potential') {
  if (items.length === 0) return 0
  return Math.round(items.reduce((sum, item) => sum + item[key], 0) / items.length)
}

function sourceLabel(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes('product hunt')) return 'Product Hunt'
  if (lower.includes('hacker news') || lower.includes(' hn')) return 'Hacker News'
  if (lower.includes('github')) return 'GitHub'
  if (lower.includes('36kr') || lower.includes('36氪')) return '36氪'
  if (lower.includes('v2ex')) return 'V2EX'
  if (lower.includes('少数派')) return '少数派'
  if (lower.includes('indiehackers')) return 'IndieHackers'
  if (lower.includes('reddit')) return 'Reddit'
  if (lower.includes('twitter') || lower.includes('x /')) return 'X / Twitter'
  return title.split(/[：:·—-]/)[0].trim().slice(0, 18) || '市场信号'
}

function SidePanel({
  title,
  label,
  children,
}: {
  title: string
  label: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-r-border bg-r-card px-4 py-4">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-r-faint mb-1">{label}</p>
      <h3 className="font-display text-[16px] font-bold text-r-text mb-4">{title}</h3>
      {children}
    </section>
  )
}

export default function DailyContent({ data, date }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {}
    data.opportunities.forEach(o => {
      counts[o.category] = (counts[o.category] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [data.opportunities])

  const avgDifficulty = getAverage(data.opportunities, 'difficulty')
  const avgPotential = getAverage(data.opportunities, 'potential')
  const sourceStats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const opp of data.opportunities) {
      for (const source of opp.sources ?? []) {
        const label = sourceLabel(source.title)
        counts[label] = (counts[label] ?? 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [data.opportunities])
  const sourceHighlights = useMemo(() => {
    const seen = new Set<string>()
    return data.opportunities
      .flatMap(opp => (opp.sources ?? []).map(source => ({ ...source, opportunityTitle: opp.title, category: opp.category })))
      .filter(source => {
        const key = `${source.title}|${source.url}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 4)
  }, [data.opportunities])

  const handleTagSelect = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)_280px] gap-5 xl:items-start">
      <aside className="xl:sticky xl:top-20 space-y-4">
        <DailyBrief
          date={data.date}
          summary={data.summary ?? ''}
          count={data.opportunities.length}
          opportunities={data.opportunities}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
        />
      </aside>

      <section className="min-w-0">
        <OpportunityList
          opportunities={data.opportunities}
          date={date}
          selectedTag={selectedTag}
        />
      </section>

      <aside className="xl:sticky xl:top-20 space-y-4 print:hidden">
        <SidePanel title="机会盘面" label="Market map">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: '机会', value: data.opportunities.length },
              { label: '难度', value: avgDifficulty },
              { label: '潜力', value: avgPotential },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-r-bg px-2 py-3 text-center">
                <p className="font-mono text-[20px] font-bold text-r-text tabular-nums leading-none">{item.value}</p>
                <p className="font-mono text-[10px] text-r-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {categoryStats.map(([cat, count]) => {
              const color = CATEGORY_COLORS[cat] ?? '#6B7280'
              const width = `${Math.max(12, Math.round((count / data.opportunities.length) * 100))}%`
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans text-[12px] text-r-body">{cat}</span>
                    <span className="font-mono text-[11px] text-r-muted">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-r-border overflow-hidden">
                    <div className="h-full rounded-full" style={{ width, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </SidePanel>

        {sourceHighlights.length > 0 && (
          <SidePanel title="触发来源" label="Source map">
            {sourceStats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {sourceStats.map(([label, count]) => (
                  <span key={label} className="font-mono text-[10px] rounded-full bg-r-bg px-2 py-1 text-r-muted">
                    {label} · {count}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {sourceHighlights.map(source => (
                <a
                  key={`${source.title}-${source.url}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-r-bg px-3 py-3 hover:bg-r-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-mono text-[12px] font-semibold text-r-text truncate">{sourceLabel(source.title)}</p>
                    <span className="font-mono text-[10px] text-r-accent flex-shrink-0">{source.category}</span>
                  </div>
                  <p className="font-sans text-[12px] leading-relaxed text-r-muted line-clamp-2">{source.title}</p>
                  <p className="font-mono text-[10px] text-r-faint mt-2 truncate">触发机会：{source.opportunityTitle}</p>
                </a>
              ))}
            </div>
          </SidePanel>
        )}
      </aside>
    </div>
  )
}
