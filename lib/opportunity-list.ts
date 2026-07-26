import type { Opportunity } from './opportunities'

export type TimeBucket = '1mo' | '1-3mo' | '3mo+'
export type SortOption = 'default' | 'recommended' | 'fastest' | 'easiest' | 'potential'

export function getTimeInMonths(timeToRevenue: string): number {
  const values = (timeToRevenue.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
  if (values.length === 0) return Number.POSITIVE_INFINITY

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  if (timeToRevenue.includes('天')) return average / 30
  if (timeToRevenue.includes('周')) return average / 4
  if (timeToRevenue.includes('年')) return average * 12
  return average
}

export function getTimeBucket(timeToRevenue: string): TimeBucket {
  const months = getTimeInMonths(timeToRevenue)
  if (months <= 1) return '1mo'
  if (months <= 3) return '1-3mo'
  return '3mo+'
}

export function getBookmarkKey(date: string, opportunityId: number): string {
  return `${date}:${opportunityId}`
}

export function compareOpportunities(a: Opportunity, b: Opportunity, sort: SortOption): number {
  if (sort === 'fastest') {
    return getTimeInMonths(a.timeToRevenue) - getTimeInMonths(b.timeToRevenue)
      || b.potential - a.potential
  }
  if (sort === 'easiest') {
    return a.difficulty - b.difficulty
      || b.potential - a.potential
  }
  if (sort === 'potential') {
    return b.potential - a.potential
      || a.difficulty - b.difficulty
  }
  if (sort === 'recommended') {
    const aScore = a.potential / Math.max(a.difficulty, 1)
    const bScore = b.potential / Math.max(b.difficulty, 1)
    return bScore - aScore
      || getTimeInMonths(a.timeToRevenue) - getTimeInMonths(b.timeToRevenue)
  }
  return 0
}
