import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, id, type } = body

    if (
      typeof date !== 'string' ||
      typeof id !== 'number' ||
      (type !== 'up' && type !== 'down')
    ) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const key = `votes:${date}:${id}`
    await kv.hincrby(key, type, 1)
    const result = await kv.hgetall<{ up?: string; down?: string }>(key)

    return NextResponse.json({
      up: parseInt(result?.up ?? '0', 10),
      down: parseInt(result?.down ?? '0', 10),
    })
  } catch (err) {
    console.error('vote error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
