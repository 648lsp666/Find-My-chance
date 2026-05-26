'use client'

interface Props {
  date: string
  summary: string
  count: number
}

export default function DailyBrief({ date, summary, count }: Props) {
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
          <p className="font-mono text-[11px] text-white/70 tracking-[0.2em] uppercase mb-1">
            AI 今日简报 · {date}
          </p>
          <h2 className="font-display font-bold text-white" style={{ fontSize: '18px' }}>
            见微 · 今日简报
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
    </div>
  )
}
