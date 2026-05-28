'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignInButton, UserButton } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'

const NAV_ITEMS = [
  { href: '/daily', label: '每日机会', match: (p: string) => /^\/\d{4}-\d{2}-\d{2}/.test(p) },
  { href: '/trends', label: '技术风口', match: (p: string) => p.startsWith('/trends') },
  { href: '/my-prds', label: '我的PRD', match: (p: string) => p === '/my-prds' },
]

export default function Header() {
  const [time, setTime] = useState('')
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { subscribed, loading, initializing, subscribe } = useSubscription()

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-r-border bg-white/95 dark:bg-[#161228]/95 backdrop-blur-md transition-colors duration-250">
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

        {/* Right: clock + subscribe + theme + auth */}
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

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center text-r-muted hover:text-r-text hover:bg-r-border transition-colors"
            aria-label={isDark ? '切换浅色模式' : '切换深色模式'}
          >
            {isDark ? (
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

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
