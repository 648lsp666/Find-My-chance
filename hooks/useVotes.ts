'use client'

import { useState, useEffect } from 'react'

export type VoteCounts = { up: number; down: number; myVote?: 'up' | 'down' | null }

export function useVotes(
  date: string,
  ids: number[],
): Record<number, VoteCounts> {
  const [counts, setCounts] = useState<Record<number, VoteCounts>>({})
  const idsKey = ids.join(',')

  useEffect(() => {
    if (!idsKey) return
    fetch(`/api/votes?date=${encodeURIComponent(date)}&ids=${idsKey}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: Record<string, { up: number; down: number; myVote?: 'up' | 'down' | null }> | null) => {
        if (!data) return
        const mapped: Record<number, VoteCounts> = {}
        for (const [key, val] of Object.entries(data)) {
          mapped[Number(key)] = val
        }
        setCounts(mapped)
      })
      .catch(() => {})
  }, [date, idsKey])

  return counts
}
