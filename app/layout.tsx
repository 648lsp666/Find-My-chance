import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from '@clerk/localizations'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ConditionalHeader from '@/components/ConditionalHeader'
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
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  openGraph: {
    siteName: '见微 Prowl',
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
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
    <ClerkProvider
      localization={zhCN}
      appearance={{ variables: { colorPrimary: '#7C3AED', borderRadius: '12px' } }}
    >
      <html lang="zh-CN" className={`${syne.variable} ${mono.variable}`}>
        <body>
          <ConditionalHeader />
          {children}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}
