'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignInButton, UserButton } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'

const NAV_ITEMS = [
  { href: '/', label: '每日机会', match: (p: string) => /^\/\d{4}-\d{2}-\d{2}/.test(p) || p === '/' },
  { href: '/trends', label: '技术风口', match: (p: string) => p.startsWith('/trends') },
]

export default function Header() {
  const [time, setTime] = useState('')
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { subscribed, loading, initializing, subscribe } = useSubscription()

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
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
            <Image src="/logo.png" alt="见微 Prowl" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-mono text-[11px] text-r-accent tracking-[0.25em] uppercase leading-none mb-0.5">
              Prowl
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
                className={`relative h-full flex items-center px-4 font-mono text-[14px] tracking-wide transition-colors ${
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

        {/* Right: clock + subscribe + auth */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="font-mono text-[11px] text-r-muted tracking-[0.15em] uppercase leading-none mb-1">
              CST · AI Powered
            </div>
            <div className="font-mono text-sm text-r-accent tabular-nums font-semibold">
              {time || '──:──:──'}
            </div>
          </div>
          {isSignedIn && !initializing && !subscribed && (
            <button
              onClick={subscribe}
              disabled={loading}
              className="hidden sm:block font-mono text-[11px] tracking-wide px-3 py-1.5 rounded-full border border-r-accent text-r-accent hover:bg-r-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              订阅每日推送
            </button>
          )}
          {isSignedIn && !initializing && subscribed && (
            <span
              title="已订阅（暂不支持取消订阅）"
              className="hidden sm:block font-mono text-[11px] text-r-muted tracking-wide"
            >
              ✓ 已订阅
            </span>
          )}
          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="font-mono text-[13px] font-bold tracking-wide px-5 py-2 rounded-full bg-r-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm">
                登录 / 注册
              </button>
            </SignInButton>
          )}
          {isSignedIn && <UserButton />}
        </div>
      </div>
    </header>
  )
}
