'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useSubscription(): {
  subscribed: boolean
  loading: boolean
  initializing: boolean
  subscribe: () => Promise<void>
} {
  const { isSignedIn } = useUser()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      setSubscribed(false)
      setInitializing(false)
      return
    }
    const controller = new AbortController()
    fetch('/api/subscribe', { signal: controller.signal })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { subscribed: boolean } | null) => {
        if (data) setSubscribed(data.subscribed)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') { /* ignore */ }
      })
      .finally(() => setInitializing(false))
    return () => controller.abort()
  }, [isSignedIn])

  async function subscribe() {
    if (subscribed || loading) return
    setLoading(true)
    setSubscribed(true) // optimistic
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' })
      if (!res.ok) throw new Error('subscribe failed')
    } catch {
      setSubscribed(false) // rollback
      alert('订阅失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return { subscribed, loading, initializing, subscribe }
}
