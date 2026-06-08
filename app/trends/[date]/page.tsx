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
      <main className="content-shell pb-20 pt-5">
        <TechSignals staticRepos={data.trending} />
        <p className="font-mono text-[10px] text-r-muted/40 text-center mt-12 tracking-[0.2em] uppercase">
          见微 Prowl · 技术信号追踪 · 每日更新
        </p>
      </main>
    </div>
  )
}
