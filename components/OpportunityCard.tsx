import type { Opportunity } from '@/lib/opportunities'

const CATEGORY_COLORS: Record<string, string> = {
  'AI应用':    'bg-blue-50 text-blue-700 border-blue-200',
  '自媒体':    'bg-purple-50 text-purple-700 border-purple-200',
  'SaaS工具':  'bg-green-50 text-green-700 border-green-200',
  '整活玩具':  'bg-orange-50 text-orange-700 border-orange-200',
  '本地服务':  'bg-yellow-50 text-yellow-700 border-yellow-200',
  '内容创作':  'bg-pink-50 text-pink-700 border-pink-200',
}

const CATEGORY_BORDER: Record<string, string> = {
  'AI应用':    'border-l-blue-400',
  '自媒体':    'border-l-purple-400',
  'SaaS工具':  'border-l-green-400',
  '整活玩具':  'border-l-orange-400',
  '本地服务':  'border-l-yellow-400',
  '内容创作':  'border-l-pink-400',
}

function DotRating({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i < value ? color : 'bg-gray-200'}`}
        />
      ))}
    </span>
  )
}

export default function OpportunityCard({ opportunity: o }: { opportunity: Opportunity }) {
  const catColor = CATEGORY_COLORS[o.category] ?? 'bg-gray-50 text-gray-700 border-gray-200'
  const borderColor = CATEGORY_BORDER[o.category] ?? 'border-l-gray-400'

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${borderColor} p-5 shadow-sm`}>
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
          {o.category}
        </span>
        <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
          {o.market}
        </span>
        {o.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs text-gray-400">#{tag}</span>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          潜力
          <DotRating value={Math.round(o.potential / 2)} max={5} color="bg-[#5b50e8]" />
        </span>
      </div>

      {/* Title */}
      <h2 className="text-base font-bold text-gray-900 mb-1">{o.title}</h2>
      <p className="text-sm text-gray-500 mb-3">{o.summary}</p>

      {/* Description */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{o.description}</p>

      {/* Pain point */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
        <span className="text-xs font-medium text-amber-700">核心痛点  </span>
        <span className="text-sm text-amber-900">{o.painPoint}</span>
      </div>

      {/* Path */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">执行路径</p>
        <ol className="space-y-1.5">
          {o.path.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5b50e8] text-white text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 mb-4 border-t border-gray-50 pt-3">
        <span>⏱ 回收周期 <strong className="text-gray-700">{o.timeToRevenue}</strong></span>
        <span>💰 启动成本 <strong className="text-gray-700">{o.startupCost}</strong></span>
        <span>🔥 竞争 <strong className="text-gray-700">{o.competition}</strong></span>
        <span className="flex items-center gap-1">
          🎚 难度
          <DotRating value={o.difficulty} max={5} color="bg-gray-500" />
        </span>
      </div>

      {/* Revenue model */}
      <p className="text-xs text-gray-500 mb-3">
        <span className="font-medium text-gray-600">收益模式：</span>{o.revenueModel}
      </p>

      {/* Sources */}
      {o.sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {o.sources.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#5b50e8] hover:underline"
            >
              {s.title} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
