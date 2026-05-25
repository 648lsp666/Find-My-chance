import { notFound } from 'next/navigation'
import { getAllDates, getOpportunities } from '@/lib/opportunities'
import Header from '@/components/Header'
import DateNav from '@/components/DateNav'
import OpportunityCard from '@/components/OpportunityCard'

export async function generateStaticParams() {
  return getAllDates().map(date => ({ date }))
}

export async function generateMetadata({ params }: { params: { date: string } }) {
  return { title: `${params.date} 机会雷达` }
}

export default function DatePage({ params }: { params: { date: string } }) {
  const data = getOpportunities(params.date)
  if (!data) notFound()

  const allDates = getAllDates()

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 pb-16">
        <DateNav dates={allDates} currentDate={params.date} />

        {data.summary && (
          <p className="text-sm text-gray-500 bg-white rounded-xl px-4 py-3 mb-6 leading-relaxed border border-gray-100">
            {data.summary}
          </p>
        )}

        <div className="space-y-4">
          {data.opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 mt-10">
          由 AI Agent 每日自动生成 · 仅供参考
        </p>
      </main>
    </div>
  )
}
