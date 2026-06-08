import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview,
  Section, Text, Row, Column,
} from '@react-email/components'
import * as React from 'react'

interface Opp {
  title: string
  category: string
  summary: string
  startupCost: string
  timeToRevenue: string
}

interface Props {
  date: string
  summary: string
  opportunities: Opp[]
  siteUrl?: string
  unsubscribeUrl?: string
}

export default function DailyDigest({
  date = '2026-05-25',
  summary = '今日市场信号摘要。',
  opportunities = [],
  siteUrl = 'https://opportunity-radar-ruby.vercel.app',
  unsubscribeUrl = '#',
}: Props) {
  const CAT_COLORS: Record<string, string> = {
    'AI应用': '#5B9CF6', '自媒体': '#A78BFA', 'SaaS工具': '#34D399',
    '整活玩具': '#F87171', '本地服务': '#FBBF24', '内容创作': '#FB923C',
  }

  return (
    <Html lang="zh">
      <Head />
      <Preview>
        {date} · {String(opportunities.length)} 个副业机会 · 每日机会雷达
      </Preview>
      <Body style={{ background: '#F4F4F5', fontFamily: 'system-ui, sans-serif', margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ background: '#0B0B12', borderRadius: '16px 16px 0 0', padding: '28px 32px 20px' }}>
            <Text style={{ color: '#E8A020', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.3em', margin: '0 0 8px', textTransform: 'uppercase' }}>
              ⌖ DAILY OPPORTUNITY RADAR
            </Text>
            <Heading style={{ color: '#E8E6F0', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
              每日机会雷达
            </Heading>
            <Text style={{ color: '#5A5A78', fontFamily: 'monospace', fontSize: '12px', margin: 0 }}>
              {date} · {opportunities.length} 个副业机会
            </Text>
          </Section>

          {/* Summary */}
          <Section style={{ background: '#111120', padding: '20px 32px', borderTop: '1px solid #1C1C30' }}>
            <Text style={{ color: '#9090A8', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
              {summary}
            </Text>
          </Section>

          {/* Opportunities */}
          <Section style={{ background: '#ffffff', padding: '24px 32px' }}>
            {opportunities.slice(0, 6).map((opp, i) => {
              const color = CAT_COLORS[opp.category] ?? '#9CA3AF'
              return (
                <Row key={i} style={{ marginBottom: '16px', borderLeft: `3px solid ${color}`, paddingLeft: '16px' }}>
                  <Column>
                    <Text style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '10px', margin: '0 0 2px', letterSpacing: '0.1em' }}>
                      {String(i + 1).padStart(2, '0')} · {opp.category}
                    </Text>
                    <Text style={{ color: '#111827', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
                      {opp.title}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.5', margin: '0 0 6px' }}>
                      {opp.summary}
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '11px', margin: 0 }}>
                      启动 {opp.startupCost} · {opp.timeToRevenue}见收益
                    </Text>
                  </Column>
                </Row>
              )
            })}
          </Section>

          {/* CTA */}
          <Section style={{ background: '#ffffff', padding: '0 32px 28px', textAlign: 'center' as const }}>
            <Hr style={{ borderColor: '#E5E7EB', margin: '0 0 20px' }} />
            <Link
              href={`${siteUrl}/${date}`}
              style={{
                background: '#E8A020', color: '#0B0B12', borderRadius: '10px',
                padding: '12px 28px', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              查看完整版 →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={{ background: '#F9FAFB', borderRadius: '0 0 16px 16px', padding: '16px 32px', borderTop: '1px solid #E5E7EB' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '11px', margin: '0 0 4px', textAlign: 'center' as const }}>
              多源信号研判 · 每日 12:00 CST 更新 · 来源可追溯
            </Text>
            <Text style={{ color: '#D1D5DB', fontSize: '11px', margin: 0, textAlign: 'center' as const }}>
              <Link href={unsubscribeUrl} style={{ color: '#9CA3AF' }}>退订</Link>
              {' · '}
              <Link href={siteUrl} style={{ color: '#9CA3AF' }}>opportunity-radar-ruby.vercel.app</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
