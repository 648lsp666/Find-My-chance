import { notFound } from 'next/navigation'
import { getAllDates, getOpportunities } from '@/lib/opportunities'
import Header from '@/components/Header'
import DateNav from '@/components/DateNav'
import OpportunityList from '@/components/OpportunityList'

export async function generateStaticParams() {
  return getAllDates().map(date => ({ date }))
}

export async function generateMetadata({ params }: { params: { date: string } }) {
  return { title: `${params.date} · 每日机会雷达` }
}

export default function DatePage({ params }: { params: { date: string } }) {
  const data = getOpportunities(params.date)
  if (!data) notFound()

  const allDates = getAllDates()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto px-4 pb-20">
        <DateNav dates={allDates} currentDate={params.date} />

        {/* Daily brief */}
        {data.summary && (
          <div className="rounded-2xl border border-r-border bg-r-card px-5 py-4 mb-6">
            <p className="font-mono text-[9px] text-r-accent tracking-[0.3em] uppercase mb-2">
              今日市场简报 · {data.date}
            </p>
            <p className="font-sans text-[13.5px] text-r-text/70 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Filter + cards */}
        <OpportunityList opportunities={data.opportunities} />

        <p className="font-mono text-[9px] text-r-muted/40 text-center mt-12 tracking-[0.2em] uppercase">
          由 Claude AI Agent 每日 12:00 CST 自动生成 · 仅供参考
        </p>
      </main>
    </div>
  )
}
