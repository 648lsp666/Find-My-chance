'use client'

import { useState } from 'react'

interface Props {
  date: string
  title?: string
}

export default function SharePdfButtons({ date, title }: Props) {
  const [copied, setCopied] = useState(false)

  const shareTitle = title ?? `${date} 每日机会雷达`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://opportunity-radar-ruby.vercel.app/${date}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
        return
      } catch {
        // user cancelled or not supported
      }
    }
    // fallback: copy link
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePdf() {
    window.print()
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-40 print:hidden">
      {/* Share */}
      <button
        onClick={handleShare}
        title="分享"
        className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: copied ? '#059669' : 'linear-gradient(135deg,#7C3AED,#5B21B6)', boxShadow: '0 4px 14px rgba(124,58,237,0.45)' }}
      >
        {copied ? (
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        )}
      </button>

      {/* PDF */}
      <button
        onClick={handlePdf}
        title="导出 PDF"
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: '#FFFFFF', color: '#7C3AED', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', border: '1.5px solid #E5E3F5' }}
      >
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </button>
    </div>
  )
}
