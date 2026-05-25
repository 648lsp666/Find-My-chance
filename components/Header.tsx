export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="font-semibold text-gray-900">每日机会雷达</span>
        </div>
        <span className="text-xs text-gray-400">副业探索 · 每日 AI 推送</span>
      </div>
    </header>
  )
}
