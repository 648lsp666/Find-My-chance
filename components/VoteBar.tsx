'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import type { VoteCounts } from '@/hooks/useVotes'

interface Props {
  date: string
  opportunityId: number
  initialCounts?: VoteCounts
}

export default function VoteBar({ date, opportunityId, initialCounts }: Props) {
  const [counts, setCounts] = useState<{ up: number; down: number }>({ up: 0, down: 0 })
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(false)
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  // When parent hydrates initialCounts from useVotes, update counts and restore voted state
  useEffect(() => {
    if (initialCounts) {
      setCounts({ up: initialCounts.up, down: initialCounts.down })
      if (initialCounts.myVote !== undefined) {
        setVoted(initialCounts.myVote ?? null)
      }
    }
  }, [initialCounts?.up, initialCounts?.down, initialCounts?.myVote])

  async function handleVote(type: 'up' | 'down') {
    if (!isSignedIn) {
      openSignIn()
      return
    }
    if (voted || loading) return

    // Optimistic update
    setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
    setVoted(type)
    setLoading(true)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, id: opportunityId, type }),
      })
      if (res.status === 409) return // already voted server-side, keep optimistic state
      if (!res.ok) throw new Error('vote failed')
      const data: { up: number; down: number } = await res.json()
      setCounts(data)
    } catch {
      // Rollback
      setCounts(prev => ({ ...prev, [type]: prev[type] - 1 }))
      setVoted(null)
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
