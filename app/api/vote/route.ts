import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await req.json()
    const { date, id, type } = body

    if (
      typeof date !== 'string' ||
      typeof id !== 'number' ||
      (type !== 'up' && type !== 'down')
    ) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const userVoteKey = `voted:${userId}:${date}:${id}`
    const existing = await kv.get(userVoteKey)
    if (existing) {
      return NextResponse.json({ error: '已投票' }, { status: 409 })
    }

    const key = `votes:${date}:${id}`
    await kv.hincrby(key, type, 1)
    await kv.set(userVoteKey, type)
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
