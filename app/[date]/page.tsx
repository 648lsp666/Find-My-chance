import { notFound } from 'next/navigation'
import { getAllDates, getOpportunities } from '@/lib/opportunities'
import Header from '@/components/Header'
import DateNav from '@/components/DateNav'
import OpportunityList from '@/components/OpportunityList'
import DailyBrief from '@/components/DailyBrief'
import SharePdfButtons from '@/components/SharePdfButtons'

export async function generateStaticParams() {
  return getAllDates().map(date => ({ date }))
}

export async function generateMetadata({ params }: { params: { date: string } }) {
  const data = getOpportunities(params.date)
  if (!data) return { title: `${params.date} · 每日机会雷达` }

  const tops = data.opportunities.slice(0, 3)
  const ogParams = new URLSearchParams({
    date: params.date,
    count: String(data.opportunities.length),
    ...(tops[0] ? { t0: tops[0].title } : {}),
    ...(tops[1] ? { t1: tops[1].title } : {}),
    ...(tops[2] ? { t2: tops[2].title } : {}),
  })
  const ogImage = `/api/og?${ogParams.toString()}`
  const desc = data.summary || `${params.date} 共 ${data.opportunities.length} 个副业机会`

  return {
    title: params.date,
    description: desc,
    openGraph: {
      title: `${params.date} 副业机会`,
      description: desc,
      url: `/${params.date}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${params.date} 每日机会雷达` }],
    },
    twitter: {
      title: `${params.date} 副业机会`,
      description: desc,
      images: [ogImage],
    },
  }
}

export default function DatePage({ params }: { params: { date: string } }) {
  const data = getOpportunities(params.date)
  if (!data) notFound()

  const allDates = getAllDates()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 pb-20">
        <DateNav dates={allDates} currentDate={params.date} />

        {/* Daily brief */}
        <DailyBrief
          date={data.date}
          summary={data.summary ?? ''}
          count={data.opportunities.length}
        />

        {/* Filter + cards */}
        <OpportunityList opportunities={data.opportunities} />

        <SharePdfButtons date={params.date} />

        <p className="font-mono text-[9px] text-r-muted/40 text-center mt-12 tracking-[0.2em] uppercase">
          由 Claude AI Agent 每日 12:00 CST 自动生成 · 仅供参考
        </p>
      </main>
    </div>
  )
}
