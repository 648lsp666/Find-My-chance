import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '每日机会雷达',
  description: '每天中午推送 3-5 个路径清晰的副业机会',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
