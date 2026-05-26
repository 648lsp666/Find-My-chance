import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'

const RESEND_KEY = process.env.RESEND_API_KEY!
const AUDIENCE_ID = '588d987b-8ad6-4acd-a267-ed5f9b15d64f'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const existing = await kv.get(`subscribe:${userId}`)
  return NextResponse.json({ subscribed: existing !== null })
}

export async function POST(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // Idempotent: already subscribed
  const existing = await kv.get(`subscribe:${userId}`)
  if (existing !== null) {
    return NextResponse.json({ ok: true, subscribed: true })
  }

  // Fetch primary email from Clerk (never trust client-supplied email)
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses.find(
    e => e.id === user.primaryEmailAddressId,
  )?.emailAddress

  if (!email) {
    return NextResponse.json({ error: '账号无绑定邮箱' }, { status: 400 })
  }

  // Add to Resend Audience
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
    // contact_already_exists is fine — still write Redis key
    if (err.name !== 'contact_already_exists') {
      console.error('Resend error:', err)
      return NextResponse.json({ error: '订阅失败，请稍后再试' }, { status: 500 })
    }
  }

  // Write Redis key
  await kv.set(`subscribe:${userId}`, email)

  return NextResponse.json({ ok: true, subscribed: true })
}
