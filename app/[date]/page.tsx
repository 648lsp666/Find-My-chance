import { notFound } from 'next/navigation'
import { getAllDates, getOpportunities } from '@/lib/opportunities'
import DateNav from '@/components/DateNav'
import OpportunityList from '@/components/OpportunityList'
import DailyBrief from '@/components/DailyBrief'
import TechSignals from '@/components/TechSignals'
import SharePdfButtons from '@/components/SharePdfButtons'

export async function generateStaticParams() {
  return getAllDates().map(date => ({ date }))
}

export async function generateMetadata({ params }: { params: { date: string } }) {
  const data = getOpportunities(params.date)
  if (!data) return { title: `${params.date} · 见微 Prowl` }

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${params.date} 见微 Prowl` }],
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
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <DateNav dates={allDates} currentDate={params.date} />

        {/* Daily brief */}
        <DailyBrief
          date={data.date}
          summary={data.summary ?? ''}
          count={data.opportunities.length}
        />

        {/* Tech signals strip */}
        <TechSignals staticRepos={data.trending} />

        {/* Section header */}
        <div className="flex items-baseline gap-3 mb-4 print:mb-2">
          <h2 className="font-display font-bold text-r-text" style={{ fontSize: '20px' }}>
            今日机会
          </h2>
          <span className="font-mono text-[12px] text-r-muted">
            · {data.opportunities.length} 个
          </span>
          <span className="font-sans text-[12px] text-r-faint ml-1">
            每条均标注来源信号
          </span>
        </div>

        {/* Filter + cards */}
        <OpportunityList opportunities={data.opportunities} />

        <SharePdfButtons date={params.date} />

        <p className="font-mono text-[10px] text-r-muted/40 text-center mt-12 tracking-[0.2em] uppercase">
          见微 Prowl · 由 Claude AI 每日自动生成 · 仅供参考
        </p>
      </main>
    </div>
  )
}
