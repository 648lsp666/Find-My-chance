import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'
import type { PrdEntry } from '@/lib/prd'
import { historyKey } from '@/lib/prd'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    const items = (await kv.get<PrdEntry[]>(historyKey(userId))) ?? []
    return NextResponse.json({ items })
  } catch (err) {
    console.error('prd-history error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
