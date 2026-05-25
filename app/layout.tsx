import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const syne = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

const SITE_URL = 'https://opportunity-radar-ruby.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '见微 Prowl',
    template: '%s · 见微 Prowl',
  },
  description: '见微知著 · AI 每天扫描 GitHub Trending 和市场热点，为你发现肉眼难见的副业机会。',
  openGraph: {
    siteName: '见微 Prowl',
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@opportunityradar',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${syne.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
