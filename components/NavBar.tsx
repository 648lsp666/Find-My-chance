'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/',
    label: '每日机会',
    match: (p: string) => /^\/\d{4}-\d{2}-\d{2}/.test(p) || p === '/',
  },
  {
    href: '/trends',
    label: '技术风口',
    match: (p: string) => p.startsWith('/trends'),
  },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-16 z-20 bg-white border-b border-r-border print:hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative font-mono text-[12px] tracking-wide px-4 py-3 transition-colors ${
                  active
                    ? 'text-r-accent'
                    : 'text-r-muted hover:text-r-text'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-r-accent rounded-t-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
