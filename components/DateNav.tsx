'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  dates: string[]
  currentDate: string
  basePath?: string
}

export default function DateNav({ dates, currentDate, basePath = '' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    setCanScrollLeft(container.scrollLeft > 2)
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 2)
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    const active = activeRef.current
    if (!container) return

    if (active) {
      container.scrollTo({
        left: active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2,
        behavior: 'auto',
      })
    }

    updateScrollState()
    container.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [currentDate, updateScrollState])

  function scrollDates(direction: -1 | 1) {
    const container = scrollRef.current
    if (!container) return
    container.scrollBy({
      left: direction * Math.max(container.clientWidth * 0.75, 240),
      behavior: 'smooth',
    })
  }

  const oldestDate = dates[dates.length - 1]
  const latestDate = dates[0]

  return (
    <div className="bg-r-card border border-r-border rounded-2xl mb-5 transition-colors print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
        <p className="font-mono text-[10px] text-r-faint tracking-[0.14em] uppercase">
          历史记录 · 共 {dates.length} 期
          {oldestDate && latestDate && (
            <span className="hidden sm:inline normal-case tracking-normal"> · {oldestDate} — {latestDate}</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollDates(-1)}
            disabled={!canScrollLeft}
            aria-label="查看更新的日期"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-r-border bg-r-bg text-r-muted transition-colors hover:border-r-accent hover:text-r-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollDates(1)}
            disabled={!canScrollRight}
            aria-label="查看更早的日期"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-r-border bg-r-bg text-r-muted transition-colors hover:border-r-accent hover:text-r-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      <div className="px-1 sm:px-3">
        <div ref={scrollRef} className="flex overflow-x-auto no-scrollbar scroll-smooth">
          {dates.map((date, i) => {
            const [, m, d] = date.split('-')
            const active = date === currentDate
            const isLatest = i === 0
            return (
              <Link
                key={date}
                ref={active ? activeRef : undefined}
                href={`${basePath}/${date}`}
                title={date}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 sm:px-5 py-3 border-b-2 transition-all duration-200 ${
                  active
                    ? 'border-r-accent text-r-accent'
                    : 'border-transparent text-r-muted hover:text-r-accent hover:bg-r-bg'
                }`}
              >
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase opacity-70">
                  {isLatest ? '最新' : `${m}月`}
                </span>
                <span className="font-mono font-bold text-[20px] leading-none tabular-nums">
                  {d}
                </span>
                {isLatest && active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-r-accent mt-0.5" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
