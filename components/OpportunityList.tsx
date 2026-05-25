'use client'

import { useState, useMemo } from 'react'
import type { Opportunity } from '@/lib/opportunities'
import OpportunityCard from './OpportunityCard'

const ALL_CATS = ['AI应用', '自媒体', 'SaaS工具', '整活玩具', '本地服务', '内容创作', '其他']

const CAT_COLORS: Record<string, string> = {
  'AI应用':   '#5B9CF6',
  '自媒体':   '#A78BFA',
  'SaaS工具': '#34D399',
  '整活玩具': '#F87171',
  '本地服务': '#FBBF24',
  '内容创作': '#FB923C',
  '其他':     '#9CA3AF',
}

interface Props {
  opportunities: Opportunity[]
}

export default function OpportunityList({ opportunities }: Props) {
  const [search, setSearch]         = useState('')
  const [activeCats, setActiveCats] = useState<string[]>([])

  const presentCats = useMemo(
    () => ALL_CATS.filter(c => opportunities.some(o => o.category === c)),
    [opportunities],
  )

  const toggleCat = (cat: string) =>
    setActiveCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return opportunities.filter(o => {
      const matchCat  = activeCats.length === 0 || activeCats.includes(o.category)
      const matchText = !q || [o.title, o.summary, o.description, o.painPoint, ...o.tags, o.revenueModel]
        .some(t => t.toLowerCase().includes(q))
      return matchCat && matchText
    })
  }, [opportunities, search, activeCats])

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-r-muted text-sm pointer-events-none">
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索机会关键词…"
          className="w-full bg-r-card border border-r-border rounded-xl pl-9 pr-4 py-2.5 text-[13.5px] text-r-text placeholder:text-r-muted/50 font-sans outline-none focus:border-r-accent/50 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-r-muted hover:text-r-faint text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCats([])}
          className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-lg border transition-all ${
            activeCats.length === 0
              ? 'border-r-accent/50 bg-r-accent/10 text-r-accent'
              : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-faint'
          }`}
        >
          全部 ({opportunities.length})
        </button>
        {presentCats.map(cat => {
          const active = activeCats.includes(cat)
          const color  = CAT_COLORS[cat] ?? '#9CA3AF'
          const count  = opportunities.filter(o => o.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                active ? 'border-opacity-60' : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-faint'
              }`}
              style={active ? { borderColor: color, background: `${color}18`, color } : {}}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((opp, i) => (
            <OpportunityCard key={opp.id} opportunity={opp} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-r-border rounded-2xl bg-r-card">
          <p className="font-display text-2xl font-bold text-r-dim mb-2">无结果</p>
          <p className="font-mono text-[11px] text-r-muted tracking-wider">
            {search ? `没有找到「${search}」相关机会` : '当前筛选条件下暂无数据'}
          </p>
        </div>
      )}

      {filtered.length > 0 && filtered.length < opportunities.length && (
        <p className="font-mono text-[10px] text-r-muted text-center mt-6 tracking-wider">
          显示 {filtered.length} / {opportunities.length} 条结果
        </p>
      )}
    </div>
  )
}
