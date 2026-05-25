'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SubscribeForm from './SubscribeForm'

const NAV_ITEMS = [
  { href: '/', label: '每日机会', match: (p: string) => /^\/\d{4}-\d{2}-\d{2}/.test(p) || p === '/' },
]

export default function Header() {
  const [time, setTime] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-r-border bg-white/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base leading-none"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}
          >
            ⌖
          </div>
          <div>
            <div className="font-mono text-[9px] text-r-accent tracking-[0.3em] uppercase leading-none mb-0.5">
              Prowl · 每日机会
            </div>
            <div className="font-display font-bold text-[17px] text-r-text leading-none tracking-tight">
              见微
            </div>
          </div>
        </div>

        {/* Center: nav */}
        <nav className="hidden md:flex items-center h-full">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative h-full flex items-center px-4 font-mono text-[12px] tracking-wide transition-colors ${
                  active ? 'text-r-accent' : 'text-r-muted hover:text-r-text'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-r-accent rounded-t-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: subscribe + clock */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <SubscribeForm />
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-mono text-[9px] text-r-muted tracking-[0.2em] uppercase leading-none mb-1">
              CST · AI Powered
            </div>
            <div className="font-mono text-sm text-r-accent tabular-nums font-semibold">
              {time || '──:──:──'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
