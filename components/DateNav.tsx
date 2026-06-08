'use client'

import Link from 'next/link'

interface Props {
  dates: string[]
  currentDate: string
  basePath?: string
}

export default function DateNav({ dates, currentDate, basePath = '' }: Props) {
  return (
    <div className="bg-r-card border border-r-border rounded-2xl mb-5 transition-colors print:hidden">
      <div className="px-1 sm:px-3">
        <div className="flex overflow-x-auto no-scrollbar">
          {dates.slice(0, 20).map((date, i) => {
            const [, m, d] = date.split('-')
            const active = date === currentDate
            const isLatest = i === 0
            return (
              <Link
                key={date}
                href={`${basePath}/${date}`}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 sm:px-5 py-3 border-b-2 transition-all duration-200 ${
                  active
                    ? 'border-r-accent text-r-accent'
                    : 'border-transparent text-r-muted hover:text-r-accent hover:bg-r-bg'
                }`}
              >
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase opacity-70">
                  {isLatest ? 'Today' : `${m}月`}
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
