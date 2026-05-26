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

const STAGGER = [0, 14, 4, 20, 8, 16, 2, 22, 10, 6, 18, 12, 24, 0, 14]

function tagStyle(count: number): { fontSize: number; fontWeight: number; color: string } {
  if (count >= 4) return { fontSize: 27, fontWeight: 800, color: '#7C3AED' }
  if (count === 3) return { fontSize: 19, fontWeight: 700, color: '#5B21B6' }
  if (count === 2) return { fontSize: 13, fontWeight: 400, color: '#6D28D9' }
  return { fontSize: 10, fontWeight: 400, color: '#C4B5FD' }
}

export default function DailyBrief({ date, summary, count, opportunities, selectedTag, onTagSelect }: Props) {
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const opp of opportunities) {
      for (const tag of opp.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
  }, [opportunities])

  if (!summary) return null

  return (
    <div
      className="rounded-2xl px-6 py-5 mb-4 relative overflow-hidden print:hidden"
      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)' }}
    >
      {/* Watermark */}
      <div
        className="absolute right-5 top-0 select-none pointer-events-none leading-none text-white font-bold"
        style={{ fontSize: '88px', opacity: 0.05 }}
      >
        ⌖
      </div>

      <div className="flex items-start justify-between gap-4 mb-3 relative">
        <div>
          <h2 className="font-display font-bold text-white" style={{ fontSize: '22px' }}>
            见微 · 今日简报 · <span className="font-mono font-normal text-white/75" style={{ fontSize: '16px' }}>{date}</span>
          </h2>
        </div>
        <div
          className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 mt-1"
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

      {tagCounts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="font-mono text-[9px] text-white/40 tracking-[0.2em] uppercase mb-3">
            今日热词 · 点击过滤，再次点击取消
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-0">
            {tagCounts.map(([tag, tagCount], i) => {
              const { fontSize, fontWeight, color } = tagStyle(tagCount)
              const isSelected = selectedTag === tag
              return (
                <span
                  key={tag}
                  onClick={() => onTagSelect(tag)}
                  style={{
                    fontSize,
                    fontWeight,
                    color: isSelected ? '#fff' : color,
                    marginTop: STAGGER[i % STAGGER.length],
                    textDecoration: isSelected ? 'underline' : 'none',
                    opacity: selectedTag && !isSelected ? 0.35 : 1,
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'opacity 0.15s, color 0.15s',
                    userSelect: 'none',
                  }}
                >
                  {tag}<sup style={{ fontSize: fontSize * 0.4, color: '#A78BFA', marginLeft: 1 }}>{tagCount}</sup>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
