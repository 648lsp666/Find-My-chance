import { notFound } from 'next/navigation'
import { getAllDates, getOpportunities } from '@/lib/opportunities'
import TechSignals from '@/components/TechSignals'

export async function generateStaticParams() {
  return getAllDates().map(date => ({ date }))
}

export async function generateMetadata({ params }: { params: { date: string } }) {
  return {
    title: `${params.date} 技术风口 · 见微 Prowl`,
    description: `${params.date} GitHub 技术趋势`,
  }
}

export default function TrendsDatePage({ params }: { params: { date: string } }) {
  const data = getOpportunities(params.date)
  if (!data) notFound()

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-6 pb-20 pt-6">
        <TechSignals staticRepos={data.trending} />
        <p className="font-mono text-[10px] text-r-muted/40 text-center mt-12 tracking-[0.2em] uppercase">
          见微 Prowl · 由 Claude AI 每日自动生成 · 仅供参考
        </p>
      </main>
    </div>
  )
}
