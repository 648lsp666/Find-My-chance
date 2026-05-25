import { redirect } from 'next/navigation'
import { getLatestDate } from '@/lib/opportunities'

export default function Home() {
  const latest = getLatestDate()
  if (latest) redirect(`/${latest}`)
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      暂无数据，等待首次推送…
    </div>
  )
}
