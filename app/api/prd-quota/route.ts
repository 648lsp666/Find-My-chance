import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'
import { DAILY_LIMIT, quotaKey } from '@/lib/prd'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    const used = (await kv.get<number>(quotaKey(userId))) ?? 0
    return NextResponse.json({ used, remaining: Math.max(0, DAILY_LIMIT - used) })
  } catch (err) {
    console.error('prd-quota error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
