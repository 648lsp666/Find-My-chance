'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Opportunity } from '@/lib/opportunities'
import {
  compareOpportunities,
  getBookmarkKey,
  getTimeBucket,
  type SortOption,
  type TimeBucket,
} from '@/lib/opportunity-list'
import OpportunityCard from './OpportunityCard'
import { useVotes } from '@/hooks/useVotes'

const BOOKMARKS_STORAGE_KEY = 'opportunity-radar:bookmarks:v1'

const ALL_CATS = [
  'AI应用',
  'SaaS工具',
  '开发工具',
  '数据服务',
  '自动化流程',
  '企业服务',
  '教育培训',
  '出海产品',
  '自媒体',
  '内容创作',
  '本地服务',
  '整活玩具',
  '其他',
]

const CAT_COLORS: Record<string, string> = {
  'AI应用':   '#7C3AED',
  '自媒体':   '#8B5CF6',
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
  '其他':     '#6B7280',
}

type TimeFilter = 'all' | TimeBucket

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all',    label: '不限' },
  { value: '1mo',   label: '⚡ 1个月内' },
  { value: '1-3mo', label: '🚀 1-3个月' },
  { value: '3mo+',  label: '📈 3个月+' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default',     label: '默认顺序' },
  { value: 'recommended', label: '综合推荐' },
  { value: 'fastest',     label: '最快变现' },
  { value: 'easiest',     label: '最低难度' },
  { value: 'potential',   label: '最高潜力' },
]

interface Props {
  opportunities: Opportunity[]
  date: string
  selectedTag: string | null
}

export default function OpportunityList({ opportunities, date, selectedTag }: Props) {
  const [search, setSearch]         = useState('')
  const [activeCats, setActiveCats] = useState<string[]>([])
  const [activeTime, setActiveTime] = useState<TimeFilter>('all')
  const [sort, setSort]             = useState<SortOption>('default')
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarks, setBookmarks]   = useState<Set<string>>(new Set())
  const ids = useMemo(() => opportunities.map(o => o.id), [opportunities])
  const voteCounts = useVotes(date, ids)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY) ?? '[]')
      if (Array.isArray(saved)) {
        setBookmarks(new Set(saved.filter((item): item is string => typeof item === 'string')))
      }
    } catch {
      localStorage.removeItem(BOOKMARKS_STORAGE_KEY)
    }
  }, [])

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
      const matchTime = activeTime === 'all' || getTimeBucket(o.timeToRevenue) === activeTime
      const matchText = !q || [o.title, o.summary, o.description, o.painPoint, ...o.tags, o.revenueModel]
        .some(t => t.toLowerCase().includes(q))
      const matchTag  = !selectedTag || o.tags.includes(selectedTag)
      const matchBookmark = !showBookmarks || bookmarks.has(getBookmarkKey(date, o.id))
      return matchCat && matchTime && matchText && matchTag && matchBookmark
    })
      .map((opportunity, originalIndex) => ({ opportunity, originalIndex }))
      .sort((a, b) => compareOpportunities(a.opportunity, b.opportunity, sort) || a.originalIndex - b.originalIndex)
      .map(({ opportunity }) => opportunity)
  }, [opportunities, search, activeCats, activeTime, selectedTag, showBookmarks, bookmarks, date, sort])

  const bookmarkedCount = useMemo(
    () => opportunities.filter(o => bookmarks.has(getBookmarkKey(date, o.id))).length,
    [opportunities, bookmarks, date],
  )

  function toggleBookmark(opportunityId: number) {
    const key = getBookmarkKey(date, opportunityId)
    setBookmarks(current => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4 print:hidden">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-r-muted text-base pointer-events-none">
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索机会关键词…"
          className="w-full bg-r-card border border-r-border rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-r-text placeholder:text-r-muted/60 font-sans outline-none focus:border-r-accent focus:ring-2 focus:ring-r-accent/10 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-r-muted hover:text-r-text text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-3 items-center print:hidden">
        <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase shrink-0">类别</span>
        <button
          onClick={() => setActiveCats([])}
          className={`font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${
            activeCats.length === 0
              ? 'border-r-accent bg-r-accent text-white shadow-sm'
              : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-accent hover:-translate-y-px'
          }`}
        >
          全部 ({opportunities.length})
        </button>
        {presentCats.map(cat => {
          const active = activeCats.includes(cat)
          const color  = CAT_COLORS[cat] ?? '#6B7280'
          const count  = opportunities.filter(o => o.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                active
                  ? ''
                  : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-accent hover:-translate-y-px'
              }`}
              style={active ? { borderColor: color, background: color, color: 'white' } : {}}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Time-to-revenue filter */}
      <div className="flex flex-wrap gap-2 mb-6 items-center print:hidden">
        <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase shrink-0">变现周期</span>
        {TIME_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTime(value)}
            className={`font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${
              activeTime === value
                ? 'border-r-time bg-r-time text-white shadow-sm'
                : 'border-r-border bg-r-card text-r-muted hover:border-teal-300 hover:text-r-time hover:-translate-y-px'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort and bookmarks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 p-3 rounded-xl border border-r-border bg-r-card print:hidden">
        <label className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase shrink-0">排序</span>
          <select
            value={sort}
            onChange={event => setSort(event.target.value as SortOption)}
            className="min-w-0 sm:min-w-[132px] rounded-lg border border-r-border bg-r-bg px-3 py-2 font-mono text-[12px] text-r-text outline-none transition-colors focus:border-r-accent focus:ring-2 focus:ring-r-accent/10"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setShowBookmarks(current => !current)}
          aria-pressed={showBookmarks}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-mono text-[12px] transition-all ${
            showBookmarks
              ? 'border-r-accent bg-r-accent text-white shadow-sm'
              : 'border-r-border bg-r-bg text-r-muted hover:border-r-accent hover:text-r-accent'
          }`}
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill={showBookmarks ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3.75A1.75 1.75 0 0 1 7.75 2h8.5A1.75 1.75 0 0 1 18 3.75V22l-6-3.75L6 22V3.75Z" />
          </svg>
          只看收藏
          <span className={showBookmarks ? 'text-white/75' : 'text-r-faint'}>({bookmarkedCount})</span>
        </button>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((opp, i) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              index={i}
              date={date}
              initialCounts={voteCounts[opp.id]}
              bookmarked={bookmarks.has(getBookmarkKey(date, opp.id))}
              onToggleBookmark={() => toggleBookmark(opp.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-r-border rounded-2xl bg-r-card">
          <p className="font-display text-2xl font-bold text-r-muted mb-2">无结果</p>
          <p className="font-mono text-[12px] text-r-faint tracking-wider">
            {showBookmarks && bookmarkedCount === 0
              ? '还没有收藏机会，点击卡片右上角的收藏按钮即可添加'
              : search
                ? `没有找到「${search}」相关机会`
                : '当前筛选条件下暂无数据'}
          </p>
        </div>
      )}

      {filtered.length > 0 && filtered.length < opportunities.length && (
        <p className="font-mono text-[11px] text-r-muted text-center mt-6 tracking-wider">
          显示 {filtered.length} / {opportunities.length} 条结果
        </p>
      )}
    </div>
  )
}
