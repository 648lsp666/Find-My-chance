import type { Opportunity } from '@/lib/opportunities'

const CATS: Record<string, { color: string; bg: string; headerBg: string; label: string }> = {
  'AI应用':   { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  headerBg: 'linear-gradient(90deg,#EDE9FE,#F5F4FF)', label: 'AI应用' },
  '自媒体':   { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  headerBg: 'linear-gradient(90deg,#EDE9FE,#F5F4FF)', label: '自媒体' },
  'SaaS工具': { color: '#059669', bg: 'rgba(5,150,105,0.08)',   headerBg: 'linear-gradient(90deg,#D1FAE5,#F0FDF4)', label: 'SaaS' },
  '整活玩具': { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   headerBg: 'linear-gradient(90deg,#FEE2E2,#FFF5F5)', label: '整活' },
  '本地服务': { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   headerBg: 'linear-gradient(90deg,#FEF3C7,#FFFBEB)', label: '本地' },
  '内容创作': { color: '#EA580C', bg: 'rgba(234,88,12,0.08)',   headerBg: 'linear-gradient(90deg,#FFEDD5,#FFF7ED)', label: '内容' },
}

function Dots({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <span className="flex gap-[3px] items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[14px] h-[3px] rounded-full"
          style={{ background: i < value ? color : '#E5E3F5' }}
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
  const cat = CATS[o.category] ?? {
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.08)',
    headerBg: 'linear-gradient(90deg,#F3F4F6,#F9FAFB)',
    label: o.category,
  }
  const num = String(index + 1).padStart(2, '0')

  return (
    <article
      className="rounded-2xl border border-r-border bg-r-card card-lift fade-in overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Colored header */}
      <div
        className="flex items-center gap-2 px-5 py-3 border-b border-r-border flex-wrap"
        style={{ background: cat.headerBg }}
      >
        <span
          className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ background: cat.color }}
        >
          {cat.label}
        </span>
        <span className="font-mono text-[11px] text-r-muted border border-r-border rounded-full px-2.5 py-1 bg-white">
          {o.market}
        </span>
        <span
          className="font-mono text-[11px] px-2.5 py-1 rounded-full border"
          style={{ background: '#F0FDFA', borderColor: '#CCFBF1', color: '#0D9488' }}
        >
          ⚡ {o.timeToRevenue}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] text-r-muted">潜力</span>
          <Dots value={Math.round(o.potential / 2)} max={5} color={cat.color} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5">
        {/* Index + Title */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-[11px] text-r-dim flex-shrink-0 tabular-nums font-semibold">{num}</span>
          <h2 className="font-display font-bold text-[19px] text-r-text leading-snug">
            {o.title}
          </h2>
        </div>

        <p className="font-sans text-[14px] text-r-muted leading-relaxed mb-3 pl-[26px]">
          {o.summary}
        </p>

        {/* Tags */}
        {o.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pl-[26px]">
            {o.tags.map(t => (
              <span
                key={t}
                className="font-mono text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: cat.bg, color: cat.color }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="font-sans text-[14px] text-r-text/80 leading-[1.75] mb-4">
          {o.description}
        </p>

        {/* Pain point */}
        <div
          className="rounded-r-lg px-4 py-3 mb-4 border-l-[3px]"
          style={{ background: '#FFFBEB', borderLeftColor: '#F59E0B' }}
        >
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase block mb-1"
            style={{ color: '#B45309' }}
          >
            核心痛点
          </span>
          <span className="font-sans text-[13px] text-r-text/80 leading-relaxed">{o.painPoint}</span>
        </div>

        {/* Path */}
        <div className="mb-4">
          <p className="font-mono text-[10px] text-r-faint tracking-[0.2em] uppercase mb-3">执行路径</p>
          <ol className="space-y-3">
            {o.path.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold mt-0.5"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {i + 1}
                </span>
                <span className="font-sans text-[14px] text-r-text/75 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Divider */}
        <div className="border-t border-r-border my-4" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          {[
            { label: '回收周期', value: o.timeToRevenue, style: { color: '#1E1B4B' } },
            { label: '启动成本', value: o.startupCost,   style: { color: '#059669' } },
            { label: '竞争程度', value: o.competition,    style: { color: '#1E1B4B' } },
          ].map(({ label, value, style }) => (
            <div key={label}>
              <p className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase mb-1.5">{label}</p>
              <p className="font-mono text-[13px] font-semibold" style={style}>{value}</p>
            </div>
          ))}
          <div>
            <p className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase mb-2">执行难度</p>
            <Dots value={o.difficulty} max={5} color={cat.color} />
          </div>
        </div>

        {/* Revenue model */}
        <p className="font-sans text-[13px] text-r-muted mb-3 leading-relaxed">
          <span className="font-mono text-[10px] text-r-faint tracking-[0.15em] uppercase mr-2">收益模式</span>
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
                className="font-mono text-[11px] tracking-wide transition-all flex items-center gap-1 hover:opacity-100"
                style={{ color: cat.color, opacity: 0.65 }}
              >
                <span>{s.title}</span>
                <span style={{ fontSize: '10px' }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
