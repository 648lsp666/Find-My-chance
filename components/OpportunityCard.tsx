import type { Opportunity } from '@/lib/opportunities'
import VoteBar from './VoteBar'
import GeneratePrdButton from './GeneratePrdButton'
import type { VoteCounts } from '@/hooks/useVotes'

const SOURCE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  'product hunt': { label: 'Product Hunt', icon: '🔶', color: '#DA552F' },
  'github':       { label: 'GitHub',        icon: '⭐', color: '#24292E' },
  '36氪':         { label: '36氪',           icon: '📰', color: '#E6353C' },
  '36kr':         { label: '36氪',           icon: '📰', color: '#E6353C' },
  'hacker news':  { label: 'Hacker News',   icon: '🔸', color: '#FF6600' },
  'hn':           { label: 'Hacker News',   icon: '🔸', color: '#FF6600' },
  'reddit':       { label: 'Reddit',        icon: '🤖', color: '#FF4500' },
  '少数派':       { label: '少数派',         icon: '📱', color: '#E44C7E' },
  '知乎':         { label: '知乎',           icon: '💬', color: '#0084FF' },
  '微博':         { label: '微博',           icon: '📣', color: '#E6162D' },
  'twitter':      { label: 'X / Twitter',   icon: '𝕏', color: '#000000' },
  'x.com':        { label: 'X / Twitter',   icon: '𝕏', color: '#000000' },
}

function parseSignal(title: string): { label: string; icon: string; color: string } {
  const lower = title.toLowerCase()
  for (const [key, val] of Object.entries(SOURCE_MAP)) {
    if (lower.includes(key)) return val
  }
  const label = title.split(/[·:—\-]/)[0].trim().slice(0, 18)
  return { label, icon: '📡', color: '#6B7280' }
}

function isSpecificUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.pathname.length > 1 && u.pathname !== '/'
  } catch {
    return false
  }
}

const CATS: Record<string, { color: string; bg: string; headerBg: string; label: string }> = {
  'AI应用':   { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  headerBg: 'linear-gradient(90deg,#EDE9FE,#F5F4FF)', label: 'AI应用' },
  '自媒体':   { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  headerBg: 'linear-gradient(90deg,#EDE9FE,#F5F4FF)', label: '自媒体' },
  'SaaS工具': { color: '#059669', bg: 'rgba(5,150,105,0.08)',   headerBg: 'linear-gradient(90deg,#D1FAE5,#F0FDF4)', label: 'SaaS' },
  '整活玩具': { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   headerBg: 'linear-gradient(90deg,#FEE2E2,#FFF5F5)', label: '整活' },
  '本地服务': { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   headerBg: 'linear-gradient(90deg,#FEF3C7,#FFFBEB)', label: '本地' },
  '内容创作': { color: '#EA580C', bg: 'rgba(234,88,12,0.08)',   headerBg: 'linear-gradient(90deg,#FFEDD5,#FFF7ED)', label: '内容' },
  '开发工具': { color: '#2563EB', bg: 'rgba(37,99,235,0.08)',    headerBg: 'linear-gradient(90deg,#DBEAFE,#F5F8FF)', label: '开发' },
  '数据服务': { color: '#0D9488', bg: 'rgba(13,148,136,0.08)',   headerBg: 'linear-gradient(90deg,#CCFBF1,#F0FDFA)', label: '数据' },
  '自动化流程': { color: '#0891B2', bg: 'rgba(8,145,178,0.08)', headerBg: 'linear-gradient(90deg,#CFFAFE,#ECFEFF)', label: '自动化' },
  '教育培训': { color: '#9333EA', bg: 'rgba(147,51,234,0.08)',   headerBg: 'linear-gradient(90deg,#F3E8FF,#FAF5FF)', label: '教育' },
  '企业服务': { color: '#4F46E5', bg: 'rgba(79,70,229,0.08)',    headerBg: 'linear-gradient(90deg,#E0E7FF,#F5F7FF)', label: '企业' },
  '出海产品': { color: '#DB2777', bg: 'rgba(219,39,119,0.08)',   headerBg: 'linear-gradient(90deg,#FCE7F3,#FFF5FA)', label: '出海' },
}

function Dots({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <span className="flex gap-[3px] items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[14px] h-[3px] rounded-full"
          style={{ background: i < value ? color : 'rgb(var(--r-border))' }}
        />
      ))}
    </span>
  )
}

export default function OpportunityCard({
  opportunity: o,
  index,
  date,
  initialCounts,
}: {
  opportunity: Opportunity
  index: number
  date: string
  initialCounts?: VoteCounts
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
      {/* Signal header — .signal-hdr gets overridden in dark mode via globals.css */}
      {o.sources.length > 0 && (() => {
        const src = o.sources[0]
        const sig = parseSignal(src.title)
        const hasLink = isSpecificUrl(src.url)
        const inner = (
          <>
            <span className="text-[14px]">{sig.icon}</span>
            <span className="font-mono text-[13px] font-semibold" style={{ color: sig.color }}>
              {sig.label}
            </span>
            <span className="font-sans text-[13px] text-r-muted truncate flex-1">
              · {src.title.replace(sig.label, '').replace(/^[\s·:—\-]+/, '')}
            </span>
            {hasLink && (
              <span className="font-mono text-[12px] text-r-faint group-hover:text-r-muted transition-colors flex-shrink-0">
                为什么今天 ↗
              </span>
            )}
          </>
        )
        const cls = "signal-hdr flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-r-border group"
        return hasLink ? (
          <a href={src.url} target="_blank" rel="noopener noreferrer" className={cls} style={{ background: `${sig.color}08` }}>
            {inner}
          </a>
        ) : (
          <div className={cls} style={{ background: `${sig.color}08` }}>
            {inner}
          </div>
        )
      })()}

      {/* Category / meta header — .cat-hdr gets overridden in dark mode */}
      <div
        className="cat-hdr flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-r-border flex-wrap"
        style={{ background: cat.headerBg }}
      >
        <span
          className="font-mono text-[12px] font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ background: cat.color }}
        >
          {cat.label}
        </span>
        <span
          className="font-mono text-[12px] px-2.5 py-1 rounded-full border"
          style={{ background: '#F0FDFA', borderColor: '#CCFBF1', color: '#0D9488' }}
        >
          ⚡ {o.timeToRevenue}
        </span>
        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
          <span className="font-mono text-[13px] text-r-muted">潜力</span>
          <Dots value={Math.round(o.potential / 2)} max={5} color={cat.color} />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 pt-4 pb-5">
        {/* Index + Title */}
        <div className="flex items-baseline gap-2 sm:gap-3 mb-2">
          <span className="font-mono text-[14px] text-r-dim flex-shrink-0 tabular-nums font-semibold">{num}</span>
          <h2 className="font-display font-bold text-[18px] sm:text-[20px] text-r-text leading-snug">
            {o.title}
          </h2>
        </div>

        {/* Summary — improved contrast vs opacity-based text */}
        <p className="font-sans text-[14px] sm:text-[15px] text-r-body leading-relaxed mb-3 sm:pl-[26px]">
          {o.summary}
        </p>

        {/* Tags */}
        {o.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 sm:pl-[26px]">
            {o.tags.map(t => (
              <span
                key={t}
                className="font-mono text-[12px] px-2 py-0.5 rounded-md"
                style={{ background: cat.bg, color: cat.color }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="font-sans text-[15px] text-r-body leading-[1.75] mb-4">
          {o.description}
        </p>

        {/* Pain point — uses CSS vars so it adapts to dark mode */}
        <div
          className="rounded-r-lg px-4 py-3 mb-4 border-l-[3px]"
          style={{ background: 'var(--r-pain-bg)', borderLeftColor: 'var(--r-pain-border)' }}
        >
          <span
            className="font-mono text-[13px] font-semibold tracking-[0.15em] uppercase block mb-1"
            style={{ color: 'var(--r-pain-label)' }}
          >
            核心痛点
          </span>
          <span className="font-sans text-[14px] text-r-body leading-relaxed">{o.painPoint}</span>
        </div>

        {/* Path */}
        <div className="mb-4">
          <p className="font-mono text-[13px] text-r-muted tracking-[0.15em] uppercase mb-3">执行路径</p>
          <ol className="space-y-3">
            {o.path.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[12px] font-bold mt-0.5"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {i + 1}
                </span>
                <span className="font-sans text-[14px] text-r-muted leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Divider */}
        <div className="border-t border-r-border my-4" />

        {/* Stats grid — use CSS vars so colors adapt in dark mode */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3">
          {[
            { label: '回收周期', value: o.timeToRevenue, style: { color: 'var(--r-text-hex)' } },
            { label: '启动成本', value: o.startupCost,   style: { color: '#059669' } },
            { label: '竞争程度', value: o.competition,    style: { color: 'var(--r-text-hex)' } },
          ].map(({ label, value, style }) => (
            <div key={label}>
              <p className="font-mono text-[13px] text-r-muted tracking-[0.1em] uppercase mb-1.5">{label}</p>
              <p className="font-mono text-[14px] font-semibold" style={style}>{value}</p>
            </div>
          ))}
          <div>
            <p className="font-mono text-[13px] text-r-muted tracking-[0.1em] uppercase mb-2">执行难度</p>
            <Dots value={o.difficulty} max={5} color={cat.color} />
          </div>
        </div>

        {/* Revenue model */}
        <p className="font-sans text-[14px] text-r-body mb-3 leading-relaxed">
          <span className="font-mono text-[13px] text-r-muted tracking-[0.1em] uppercase mr-2">收益模式</span>
          {o.revenueModel}
        </p>

        {/* Sources */}
        {o.sources.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {o.sources.map((s, i) => {
              const hasLink = isSpecificUrl(s.url)
              const cls = "font-mono text-[12px] tracking-wide flex items-center gap-1"
              return hasLink ? (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cls} transition-all hover:opacity-100`}
                  style={{ color: cat.color, opacity: 0.65 }}
                >
                  <span>{s.title}</span>
                  <span style={{ fontSize: '12px' }}>↗</span>
                </a>
              ) : (
                <span key={i} className={cls} style={{ color: cat.color, opacity: 0.5 }}>
                  {s.title}
                </span>
              )
            })}
          </div>
        )}

        <VoteBar date={date} opportunityId={o.id} initialCounts={initialCounts} />
        <GeneratePrdButton opportunity={o} />
      </div>
    </article>
  )
}
