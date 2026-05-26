'use client'

import { useState, useEffect } from 'react'
import type { VoteCounts } from '@/hooks/useVotes'

interface Props {
  date: string
  opportunityId: number
  initialCounts?: VoteCounts
}

export default function VoteBar({ date, opportunityId, initialCounts }: Props) {
  const [counts, setCounts] = useState<VoteCounts>({ up: 0, down: 0 })
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(false)

  // When parent hydrates initialCounts from useVotes, update local counts (only if not yet voted)
  useEffect(() => {
    if (initialCounts && !voted) {
      setCounts(initialCounts)
    }
  }, [initialCounts?.up, initialCounts?.down]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore voted state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`voted:${date}:${opportunityId}`)
    if (stored === 'up' || stored === 'down') setVoted(stored)
  }, [date, opportunityId])

  async function handleVote(type: 'up' | 'down') {
    if (voted || loading) return

    // Optimistic update
    setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
    setVoted(type)
    localStorage.setItem(`voted:${date}:${opportunityId}`, type)
    setLoading(true)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, id: opportunityId, type }),
      })
      if (!res.ok) throw new Error('vote failed')
      const data: VoteCounts = await res.json()
      setCounts(data)
    } catch {
      // Rollback
      setCounts(prev => ({ ...prev, [type]: prev[type] - 1 }))
      setVoted(null)
      localStorage.removeItem(`voted:${date}:${opportunityId}`)
      alert('投票失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = voted !== null || loading

  function btnStyle(type: 'up' | 'down') {
    const isVoted = voted === type
    const isOther = voted !== null && voted !== type
    return {
      background: isVoted
        ? type === 'up' ? '#f0fdf4' : '#fef2f2'
        : isOther
          ? '#f9fafb'
          : type === 'up' ? '#f0fdf4' : '#fef2f2',
      color: isVoted
        ? type === 'up' ? '#16a34a' : '#dc2626'
        : isOther
          ? '#9ca3af'
          : type === 'up' ? '#16a34a' : '#dc2626',
      borderRadius: '20px',
      padding: '7px 16px',
      fontSize: '14px',
      fontWeight: 600,
      border: 'none',
      cursor: isDisabled ? 'default' : 'pointer',
      opacity: isOther ? 0.5 : 1,
      transition: 'all 0.15s',
    } as React.CSSProperties
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-r-border mt-3">
      <span className="font-mono text-[11px] text-r-faint tracking-[0.15em] uppercase flex-1">
        对你有帮助吗？
      </span>
      <button onClick={() => handleVote('up')} disabled={isDisabled} style={btnStyle('up')}>
        👍 {counts.up > 0 ? counts.up : ''}
      </button>
      <button onClick={() => handleVote('down')} disabled={isDisabled} style={btnStyle('down')}>
        👎 {counts.down > 0 ? counts.down : ''}
      </button>
    </div>
  )
}
