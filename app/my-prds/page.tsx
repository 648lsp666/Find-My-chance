'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import type { PrdEntry } from '@/lib/prd'
import { DAILY_LIMIT } from '@/lib/prd'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MyPrdsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const [items, setItems] = useState<PrdEntry[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setLoading(false); return }

    Promise.all([
      fetch('/api/prd-history').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/prd-quota').then(r => r.ok ? r.json() : { remaining: 0 }),
    ]).then(([hist, quota]) => {
      setItems(hist.items ?? [])
      setRemaining(quota.remaining ?? 0)
    }).catch(() => { setFetchError(true) }).finally(() => setLoading(false))
  }, [isSignedIn, isLoaded])

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }, [])

  async function handleCopy(item: PrdEntry) {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopied(item.id)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-r-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-r-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-r-bg flex flex-col items-center justify-center text-center px-6">
        <div className="text-4xl mb-4">📄</div>
        <h1 className="font-display font-bold text-r-text text-[28px] mb-3">我的 PRD</h1>
        <p className="font-sans text-r-muted text-[15px] mb-6">登录后查看你生成的所有 PRD</p>
        <button
          onClick={() => openSignIn()}
          className="font-mono font-bold text-[14px] px-6 py-3 rounded-full text-white"
          style={{ background: '#7C3AED' }}
        >
          登录 / 注册
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-r-bg">
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-r-text mb-1" style={{ fontSize: '42px', letterSpacing: '-0.02em' }}>
              我的 PRD
            </h1>
            <p className="font-sans text-r-muted text-[15px]">共 {items.length} 份，AI 生成的产品需求文档</p>
          </div>
          {remaining !== null && (
            <div className="text-right">
              <p className="font-mono text-[11px] text-r-muted tracking-widest uppercase">今日剩余</p>
              <p className="font-mono text-[28px] font-bold text-r-accent leading-none">
                {remaining}<span className="text-[16px] text-r-muted font-normal">/{DAILY_LIMIT}</span>
              </p>
            </div>
          )}
        </div>

        {fetchError && (
          <div className="rounded-xl px-4 py-3 mb-6" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <p className="font-sans text-[14px]" style={{ color: '#DC2626' }}>加载失败，请刷新重试</p>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="rounded-2xl border border-r-border bg-r-card p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="font-display font-bold text-r-text text-[20px] mb-2">还没有生成过 PRD</p>
            <p className="font-sans text-r-muted text-[14px]">
              在机会卡片底部点击「生成 PRD」开始
            </p>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border border-r-border bg-r-card overflow-hidden"
            >
              {/* Item header */}
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-r-bg transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-r-text text-[16px] truncate">
                      {item.opportunityTitle}
                    </span>
                    {item.isCustom && (
                      <span className="flex-shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
                        自定义
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[12px] text-r-muted">{formatDate(item.createdAt)}</p>
                </div>
                <span className="font-mono text-[18px] text-r-muted ml-4 flex-shrink-0" style={{ transform: expandedId === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  ▾
                </span>
              </button>

              {/* Expanded content */}
              {expandedId === item.id && (
                <div className="border-t border-r-border">
                  <pre className="px-5 py-4 font-sans text-[13px] text-r-text leading-[1.8] whitespace-pre-wrap break-words overflow-auto max-h-[60vh]">
                    {item.content}
                  </pre>
                  <div className="px-5 py-3 border-t border-r-border flex items-center gap-3" style={{ background: '#FAFAFE' }}>
                    <button
                      onClick={() => handleCopy(item)}
                      className="font-mono text-[12px] font-bold px-4 py-2 rounded-full text-white transition-colors"
                      style={{ background: copied === item.id ? '#10B981' : '#7C3AED' }}
                    >
                      {copied === item.id ? '✓ 已复制' : '复制全文'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
