import { fetchGithubTrending } from '@/lib/trending'
import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const repos = await fetchGithubTrending()
  return NextResponse.json(repos)
}
