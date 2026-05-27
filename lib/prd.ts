export const DAILY_LIMIT = 3

export interface PrdEntry {
  id: string
  opportunityId: number
  opportunityTitle: string
  createdAt: string  // ISO string
  content: string    // markdown
  isCustom: boolean  // true if BYOK was used
}

export function quotaKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `prd:count:${userId}:${today}`
}

export function historyKey(userId: string): string {
  return `prd:history:${userId}`
}
