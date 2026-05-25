'use client'

import Link from 'next/link'

interface Props {
  dates: string[]
  currentDate: string
}

export default function DateNav({ dates, currentDate }: Props) {
  return (
    <div className="py-5">
      <p className="font-mono text-[9px] text-r-muted tracking-[0.25em] uppercase mb-3 px-0.5">
        期刊存档
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {dates.slice(0, 20).map((date, i) => {
          const [y, m, d] = date.split('-')
          const active = date === currentDate
          const isLatest = i === 0
          return (
            <Link
              key={date}
              href={`/${date}`}
              className={`flex-shrink-0 rounded-xl border transition-all duration-200 text-center px-3 pt-2 pb-2.5 min-w-[52px] ${
                active
                  ? 'border-r-accent/60 bg-r-accent/10 text-r-accent'
                  : 'border-r-border bg-r-card text-r-muted hover:border-r-dim hover:text-r-faint'
              }`}
            >
              <div className="font-mono text-[8px] tracking-[0.2em] uppercase leading-none mb-1 opacity-70">
                {isLatest ? 'TODAY' : `${m}月`}
              </div>
              <div className="font-mono font-medium text-[20px] leading-none tabular-nums">
                {d}
              </div>
              {isLatest && (
                <div className="w-1 h-1 rounded-full bg-r-accent mx-auto mt-1.5" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
