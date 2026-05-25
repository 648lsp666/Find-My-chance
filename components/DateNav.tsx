'use client'

import Link from 'next/link'

interface Props {
  dates: string[]
  currentDate: string
}

function formatDate(d: string) {
  const [, m, day] = d.split('-')
  return `${m}/${day}`
}

export default function DateNav({ dates, currentDate }: Props) {
  const visible = dates.slice(0, 14)

  return (
    <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
      {visible.map(date => (
        <Link
          key={date}
          href={`/${date}`}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            date === currentDate
              ? 'bg-[#5b50e8] text-white'
              : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
          }`}
        >
          {date === dates[0] ? `今天 ${formatDate(date)}` : formatDate(date)}
        </Link>
      ))}
    </div>
  )
}
