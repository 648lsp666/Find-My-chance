import type { Opportunity } from '@/lib/opportunities'

const CATS: Record<string, { color: string; bg: string; label: string }> = {
  'AI应用':   { color: '#5B9CF6', bg: 'rgba(91,156,246,0.1)',  label: 'AI应用' },
  '自媒体':   { color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', label: '自媒体' },
  'SaaS工具': { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  label: 'SaaS'   },
  '整活玩具': { color: '#F87171', bg: 'rgba(248,113,113,0.1)', label: '整活'   },
  '本地服务': { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  label: '本地'   },
  '内容创作': { color: '#FB923C', bg: 'rgba(251,146,60,0.1)',  label: '内容'   },
}

function Dots({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <span className="flex gap-[3px] items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[14px] h-[3px] rounded-full transition-colors"
          style={{ background: i < value ? color : '#1C1C30' }}
        />
      ))}
    </span>
  )
}

export default function OpportunityCard({
  opportunity: o,
  index,
}: {
  opportunity: Opportunity
  index: number
}) {
  const cat = CATS[o.category] ?? { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', label: o.category }
  const num = String(index + 1).padStart(2, '0')

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-r-border bg-r-card card-lift fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Colored left strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: cat.color }}
      />

      {/* Ghost index number */}
      <div
        className="absolute right-0 top-0 font-display font-bold select-none pointer-events-none leading-none"
        style={{
          fontSize: '120px',
          color: cat.color,
          opacity: 0.04,
          transform: 'translate(8px, -12px)',
        }}
      >
        {num}
      </div>

      <div className="pl-6 pr-5 pt-5 pb-5 relative">
        {/* Category + market + potential row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span
            className="font-mono text-[10px] font-medium px-2.5 py-1 rounded-md tracking-wider"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
          <span className="font-mono text-[10px] text-r-muted border border-r-border rounded-md px-2.5 py-1 tracking-wide">
            {o.market}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[9px] text-r-muted tracking-widest uppercase">潜力</span>
            <Dots value={Math.round(o.potential / 2)} max={5} color={cat.color} />
          </div>
        </div>

        {/* Index + Title */}
        <div className="flex items-baseline gap-3 mb-1.5">
          <span className="font-mono text-[11px] text-r-muted flex-shrink-0 tabular-nums">{num}</span>
          <h2 className="font-display font-bold text-[19px] text-r-text leading-snug tracking-tight">
            {o.title}
          </h2>
        </div>

        <p className="font-sans text-[13px] text-r-muted leading-relaxed mb-4 pl-[26px]">
          {o.summary}
        </p>

        {/* Tags */}
        {o.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pl-[26px]">
            {o.tags.map(t => (
              <span key={t} className="font-mono text-[9px] text-r-muted/60 tracking-wider">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="font-sans text-[13.5px] text-r-text/65 leading-[1.75] mb-4">
          {o.description}
        </p>

        {/* Pain point */}
        <div
          className="rounded-lg px-4 py-3 mb-5 border-l-2"
          style={{ background: 'rgba(232,160,32,0.07)', borderLeftColor: '#E8A020' }}
        >
          <span className="font-mono text-[9px] text-r-accent tracking-[0.25em] uppercase mr-2">
            核心痛点
          </span>
          <span className="font-sans text-[13px] text-r-text/75 leading-relaxed">{o.painPoint}</span>
        </div>

        {/* Path */}
        <div className="mb-5">
          <p className="font-mono text-[9px] text-r-muted tracking-[0.25em] uppercase mb-3">
            执行路径
          </p>
          <ol className="space-y-3">
            {o.path.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-medium mt-0.5"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {i + 1}
                </span>
                <span className="font-sans text-[13.5px] text-r-text/70 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Divider */}
        <div className="border-t border-r-border/60 my-4" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: '回收周期', value: o.timeToRevenue, valueColor: '#E8E6F0' },
            { label: '启动成本', value: o.startupCost,   valueColor: '#34D399' },
            { label: '竞争程度', value: o.competition,    valueColor: '#E8E6F0' },
          ].map(({ label, value, valueColor }) => (
            <div key={label}>
              <p className="font-mono text-[8px] text-r-muted tracking-[0.2em] uppercase mb-1.5">{label}</p>
              <p className="font-mono text-[13px] font-medium tabular-nums" style={{ color: valueColor }}>{value}</p>
            </div>
          ))}
          <div>
            <p className="font-mono text-[8px] text-r-muted tracking-[0.2em] uppercase mb-2">执行难度</p>
            <Dots value={o.difficulty} max={5} color={cat.color} />
          </div>
        </div>

        {/* Revenue model */}
        <p className="font-sans text-[12px] text-r-muted mb-4 leading-relaxed">
          <span className="font-mono text-[9px] text-r-muted/50 tracking-[0.2em] uppercase mr-2">收益模式</span>
          {o.revenueModel}
        </p>

        {/* Sources */}
        {o.sources.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {o.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-wide transition-all hover:opacity-100 flex items-center gap-1"
                style={{ color: cat.color, opacity: 0.6 }}
              >
                <span>{s.title}</span>
                <span style={{ fontSize: '9px' }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
