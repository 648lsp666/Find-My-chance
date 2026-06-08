'use client'

import { useMemo } from 'react'
import type { Opportunity } from '@/lib/opportunities'

interface Props {
  date: string
  summary: string
  count: number
  opportunities: Opportunity[]
  selectedTag: string | null
  onTagSelect: (tag: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI应用': '#A78BFA',
  '自媒体': '#C4B5FD',
  'SaaS工具': '#6EE7B7',
  '整活玩具': '#FCA5A5',
  '本地服务': '#FCD34D',
  '内容创作': '#FDBA74',
}

interface ThemeGroup {
  category: string
  count: number
  tags: Array<[string, number]>
  lead: Opportunity
}

export default function DailyBrief({ date, summary, count, opportunities, selectedTag, onTagSelect }: Props) {
  const themeGroups = useMemo<ThemeGroup[]>(() => {
    const grouped = new Map<string, Opportunity[]>()
    for (const opp of opportunities) {
      grouped.set(opp.category, [...(grouped.get(opp.category) ?? []), opp])
    }

    return Array.from(grouped.entries())
      .map(([category, items]) => {
        const tagCounts: Record<string, number> = {}
        for (const item of items) {
          for (const tag of item.tags) {
            tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
          }
        }
        const lead = [...items].sort((a, b) => b.potential - a.potential || a.difficulty - b.difficulty)[0]
        return {
          category,
          count: items.length,
          tags: Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
            .slice(0, 5),
          lead,
        }
      })
      .sort((a, b) => b.count - a.count || b.lead.potential - a.lead.potential)
  }, [opportunities])

  if (!summary) return null

  return (
    <div
      className="rounded-2xl px-4 sm:px-5 py-5 relative overflow-hidden print:hidden"
      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)' }}
    >
      {/* Watermark */}
      <div
        className="absolute right-5 top-0 select-none pointer-events-none leading-none text-white font-bold"
        style={{ fontSize: '88px', opacity: 0.05 }}
      >
        ⌖
      </div>

      <div className="flex flex-col sm:flex-row xl:flex-col items-start justify-between gap-3 mb-3 relative">
        <div>
          <h2 className="font-display font-bold text-white leading-snug text-[20px]">
            见微 · 今日简报
            <span className="block font-mono font-normal text-white/75 text-[13px] mt-1">{date}</span>
          </h2>
        </div>
        <div
          className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[12px] text-white/90 tracking-[0.1em]">
            {count} 个机会
          </span>
        </div>
      </div>

      <p
        className="font-sans leading-relaxed relative"
        style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}
      >
        {summary}
      </p>

      {themeGroups.length > 0 && (
        <div className="mt-4 rounded-xl px-4 py-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-mono text-[9px] text-white/50 tracking-[0.2em] uppercase">
              主题线索 · 点击标签过滤
            </p>
            {selectedTag && (
              <button
                type="button"
                onClick={() => onTagSelect(selectedTag)}
                className="font-mono text-[10px] text-white/70 hover:text-white transition-colors"
              >
                清除筛选
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {themeGroups.map(group => {
              const color = CATEGORY_COLORS[group.category] ?? '#C4B5FD'
              const active = group.tags.some(([tag]) => tag === selectedTag)
              return (
                <div
                  key={group.category}
                  className="rounded-xl px-3 py-3 transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                    border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full truncate"
                        style={{ background: `${color}24`, color }}
                      >
                        {group.category}
                      </span>
                      <span className="font-mono text-[10px] text-white/45 flex-shrink-0">{group.count} 个机会</span>
                    </div>
                    <span className="font-mono text-[10px] text-white/45 flex-shrink-0">
                      潜力 {group.lead.potential}/10
                    </span>
                  </div>

                  <p className="font-sans text-[13px] text-white/90 leading-snug mb-2 line-clamp-2">
                    {group.lead.title}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map(([tag, tagCount]) => {
                      const isSelected = selectedTag === tag
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => onTagSelect(tag)}
                          className="font-mono text-[10px] rounded-full px-2 py-1 transition-all"
                          style={{
                            background: isSelected ? color : 'rgba(255,255,255,0.08)',
                            color: isSelected ? '#1E1B4B' : 'rgba(255,255,255,0.78)',
                          }}
                        >
                          #{tag}
                          {tagCount > 1 && <span className="ml-1 opacity-70">×{tagCount}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
