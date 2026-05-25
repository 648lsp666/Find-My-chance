import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
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
    default: '每日机会雷达',
    template: '%s · 每日机会雷达',
  },
  description: 'AI 每天扫描 GitHub Trending、Product Hunt 和国内热点，为你生成 3–8 个有执行路径的副业机会。',
  openGraph: {
    siteName: '每日机会雷达',
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
