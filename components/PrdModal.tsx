// components/PrdModal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { Opportunity } from '@/lib/opportunities'
import { DAILY_LIMIT } from '@/lib/prd'

interface Props {
  opportunity: Opportunity
  onClose: () => void
}

export default function PrdModal({ opportunity, onClose }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showByok, setShowByok] = useState(false)
  const [userApiKey, setUserApiKey] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  // Load BYOK settings from localStorage
  useEffect(() => {
    setUserApiKey(localStorage.getItem('prd_api_key') ?? '')
    setCustomPrompt(localStorage.getItem('prd_custom_prompt') ?? '')
  }, [])

  // Fetch quota
  useEffect(() => {
    fetch('/api/prd-quota')
      .then(r => r.ok ? r.json() : null)
      .then((data: { remaining: number } | null) => {
        if (data) setRemaining(data.remaining)
      })
      .catch(() => setRemaining(0))
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleByokChange(key: string, value: string) {
    if (key === 'apiKey') {
      setUserApiKey(value)
      localStorage.setItem('prd_api_key', value)
    } else {
      setCustomPrompt(value)
      localStorage.setItem('prd_custom_prompt', value)
    }
  }

  async function handleGenerate() {
    if (generating || remaining === 0) return
    setGenerating(true)
    setError('')
    setContent('')
    try {
      const res = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity,
          customPrompt: showByok ? customPrompt.trim() || undefined : undefined,
          userApiKey: showByok ? userApiKey.trim() || undefined : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '生成失败，请稍后重试')
        return
      }
      setContent(data.content)
      setRemaining(data.remaining)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canGenerate = remaining !== null && remaining > 0 && !generating

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-r-border flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #EDE9FE, #F5F4FF)' }}
        >
          <div>
            <p className="font-mono text-[11px] text-r-accent tracking-widest uppercase mb-0.5">生成 PRD</p>
            <h3 className="font-display font-bold text-r-text text-[16px] leading-snug line-clamp-1">
              {opportunity.title}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {remaining !== null && (
              <span className="font-mono text-[11px] text-r-muted">
                今日剩余 <span className="text-r-accent font-bold">{remaining}</span>/{DAILY_LIMIT}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-r-muted hover:text-r-text hover:bg-r-border transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Empty state */}
          {!content && !generating && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                style={{ background: 'rgba(124,58,237,0.08)' }}
              >
                📄
              </div>
              <p className="font-display font-bold text-r-text text-[20px] mb-2">AI 定制 PRD</p>
              <p className="font-sans text-r-muted text-[14px] leading-relaxed max-w-sm">
                基于该机会生成结构化产品需求文档，包含目标用户、核心功能、技术建议和商业化思路
              </p>
              {remaining === 0 && (
                <p className="font-mono text-[12px] mt-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>
                  今日次数已用完，明日 00:00 重置
                </p>
              )}
            </div>
          )}

          {/* Generating */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-r-accent border-t-transparent animate-spin mb-4" />
              <p className="font-mono text-[13px] text-r-muted">AI 正在生成 PRD…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <p className="font-sans text-[14px]" style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {content && (
            <pre className="font-sans text-[14px] text-r-text leading-[1.8] whitespace-pre-wrap break-words">
              {content}
            </pre>
          )}
        </div>

        {/* BYOK settings */}
        <div className="flex-shrink-0 border-t border-r-border">
          <button
            onClick={() => setShowByok(v => !v)}
            className="w-full flex items-center justify-between px-6 py-3 font-mono text-[12px] text-r-muted hover:text-r-text transition-colors"
          >
            <span>⚙ 高级设置（自带 API Key）</span>
            <span style={{ transform: showByok ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {showByok && (
            <div className="px-6 pb-4 space-y-3" style={{ background: '#FAFAFE' }}>
              <div>
                <label className="font-mono text-[11px] text-r-muted block mb-1">DeepSeek API Key（存于本地，不上传服务器）</label>
                <input
                  type="password"
                  value={userApiKey}
                  onChange={e => handleByokChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full font-mono text-[13px] px-3 py-2 rounded-lg border border-r-border focus:outline-none focus:border-r-accent"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-r-muted block mb-1">偏好前缀（如：我擅长 Python，偏向 ToB 市场）</label>
                <textarea
                  value={customPrompt}
                  onChange={e => handleByokChange('customPrompt', e.target.value)}
                  placeholder="描述你的技术背景和市场偏好，AI 将据此定制 PRD…"
                  rows={2}
                  className="w-full font-sans text-[13px] px-3 py-2 rounded-lg border border-r-border focus:outline-none focus:border-r-accent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-t border-r-border" style={{ background: '#FAFAFE' }}>
          {content ? (
            <>
              <button
                onClick={handleCopy}
                className="font-mono text-[13px] font-bold px-5 py-2.5 rounded-full text-white transition-all hover:opacity-90"
                style={{ background: copied ? '#10B981' : '#7C3AED' }}
              >
                {copied ? '✓ 已复制' : '复制全文'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="font-mono text-[13px] px-5 py-2.5 rounded-full border border-r-border text-r-muted hover:text-r-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                重新生成
              </button>
              <a
                href="/my-prds"
                className="font-mono text-[12px] text-r-accent ml-auto hover:underline"
              >
                查看历史 →
              </a>
            </>
          ) : (
            <>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="font-mono text-[14px] font-bold px-6 py-2.5 rounded-full text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#7C3AED', boxShadow: canGenerate ? '0 4px 16px rgba(124,58,237,0.35)' : 'none' }}
              >
                {generating ? '生成中…' : '生成 PRD'}
              </button>
              <span className="font-mono text-[12px] text-r-muted">
                {showByok && userApiKey ? '使用自带 Key' : '使用免费次数'}
                {showByok && customPrompt ? ' · 已设偏好' : ''}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
