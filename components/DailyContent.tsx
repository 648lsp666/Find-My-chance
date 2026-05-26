'use client'

import { useState } from 'react'
import type { DayData } from '@/lib/opportunities'
import DailyBrief from './DailyBrief'
import OpportunityList from './OpportunityList'

interface Props {
  data: DayData
  date: string
}

export default function DailyContent({ data, date }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const handleTagSelect = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag)
  }

  return (
    <>
      <DailyBrief
        date={data.date}
        summary={data.summary ?? ''}
        count={data.opportunities.length}
        opportunities={data.opportunities}
        selectedTag={selectedTag}
        onTagSelect={handleTagSelect}
      />
      <OpportunityList
        opportunities={data.opportunities}
        date={date}
        selectedTag={selectedTag}
      />
    </>
  )
}
