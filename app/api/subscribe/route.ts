import { NextRequest, NextResponse } from 'next/server'

const RESEND_KEY      = process.env.RESEND_API_KEY!
const AUDIENCE_ID     = '588d987b-8ad6-4acd-a267-ed5f9b15d64f'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    const res = await fetch(
      `https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      },
    )

    if (!res.ok) {
      const err = await res.json()
      // Already subscribed is fine
      if (err.name === 'contact_already_exists') {
        return NextResponse.json({ ok: true, message: '已经订阅过了' })
      }
      throw new Error(err.message ?? 'Resend error')
    }

    return NextResponse.json({ ok: true, message: '订阅成功！每天 12 点收到推送' })
  } catch (err) {
    console.error('subscribe error:', err)
    return NextResponse.json({ error: '订阅失败，请稍后再试' }, { status: 500 })
  }
}
