import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import DailyDigest from '@/emails/DailyDigest'
import { getOpportunities, getLatestDate } from '@/lib/opportunities'

const AUDIENCE_ID = '588d987b-8ad6-4acd-a267-ed5f9b15d64f'
const WEBHOOK_SECRET = process.env.DIGEST_WEBHOOK_SECRET ?? ''

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  // Simple shared-secret auth so only the CCR agent can trigger this
  const secret = req.headers.get('x-webhook-secret')
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = getLatestDate()
  if (!date) return NextResponse.json({ error: 'No data' }, { status: 404 })

  const data = getOpportunities(date)
  if (!data) return NextResponse.json({ error: 'No data for date' }, { status: 404 })

  // Fetch subscriber list
  const contactsRes = await fetch(
    `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`,
    { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } },
  )
  const { data: contacts } = await contactsRes.json() as { data: { email: string; unsubscribed: boolean }[] }
  const recipients = (contacts ?? []).filter(c => !c.unsubscribed).map(c => c.email)

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No subscribers yet' })
  }

  const siteUrl = 'https://opportunity-radar-ruby.vercel.app'
  const html = await render(
    DailyDigest({
      date,
      summary: data.summary,
      opportunities: data.opportunities.map(o => ({
        title: o.title,
        category: o.category,
        summary: o.summary,
        startupCost: o.startupCost,
        timeToRevenue: o.timeToRevenue,
      })),
      siteUrl,
    }),
  )

  // Send in batches of 50 (Resend free plan limit)
  let sent = 0
  const BATCH = 50
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH)
    await resend.emails.send({
      from: '每日机会雷达 <digest@opportunity-radar-ruby.vercel.app>',
      to: batch,
      subject: `${date} · ${data.opportunities.length} 个副业机会`,
      html,
    })
    sent += batch.length
  }

  return NextResponse.json({ ok: true, sent, date })
}
