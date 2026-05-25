'use client'

import { useState } from 'react'

export default function SubscribeForm() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg]       = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('ok')
        setMsg(data.message)
        setEmail('')
      } else {
        setStatus('error')
        setMsg(data.error ?? '订阅失败')
      }
    } catch {
      setStatus('error')
      setMsg('网络错误，请稍后再试')
    }
  }

  if (status === 'ok') {
    return (
      <div className="flex items-center gap-2 font-mono text-[11px] text-r-accent tracking-wider">
        <span>✓</span>
        <span>{msg}</span>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="输入邮箱订阅每日推送"
        required
        className="bg-r-card border border-r-border rounded-lg px-3 py-1.5 text-[12px] text-r-text placeholder:text-r-muted/50 font-sans outline-none focus:border-r-accent/50 transition-colors w-48"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg border border-r-accent/50 bg-r-accent/10 text-r-accent hover:bg-r-accent/20 transition-all disabled:opacity-50"
      >
        {status === 'loading' ? '…' : '订阅'}
      </button>
      {status === 'error' && (
        <span className="font-mono text-[10px] text-red-400">{msg}</span>
      )}
    </form>
  )
}
