import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { kv } from '@/lib/kv'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const idsParam = searchParams.get('ids')

    if (!date || !idsParam) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const ids = idsParam.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
    if (ids.length === 0) {
      return NextResponse.json({})
    }

    // Batch fetch aggregate counts
    const pipeline = kv.pipeline()
    for (const id of ids) {
      pipeline.hgetall(`votes:${date}:${id}`)
    }
    const results = await pipeline.exec()

    // Batch fetch per-user vote state (if logged in)
    const { userId } = await auth()
    let myVoteResults: (string | null)[] = ids.map(() => null)

    if (userId) {
      const pipeline2 = kv.pipeline()
      for (const id of ids) {
        pipeline2.get(`voted:${userId}:${date}:${id}`)
      }
      myVoteResults = (await pipeline2.exec()) as (string | null)[]
    }

    const response: Record<string, { up: number; down: number; myVote: 'up' | 'down' | null }> = {}
    ids.forEach((id, i) => {
      const raw = (results[i] ?? {}) as Record<string, string>
      const myVote = (myVoteResults[i] as 'up' | 'down' | null) ?? null
      response[String(id)] = {
        up: parseInt(raw.up ?? '0', 10),
        down: parseInt(raw.down ?? '0', 10),
        myVote,
      }
    })

    return NextResponse.json(response)
  } catch (err) {
    console.error('votes error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
