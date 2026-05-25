import fs from 'fs'
import path from 'path'

export interface Source {
  title: string
  url: string
}

export interface Opportunity {
  id: number
  title: string
  category: string
  market: string
  tags: string[]
  summary: string
  description: string
  painPoint: string
  path: string[]
  revenueModel: string
  timeToRevenue: string
  startupCost: string
  difficulty: number
  potential: number
  competition: string
  sources: Source[]
}

export interface DayData {
  date: string
  generatedAt: string
  summary: string
  opportunities: Opportunity[]
}

const DATA_DIR = path.join(process.cwd(), 'data', 'opportunities')

export function getAllDates(): string[] {
  try {
    const files = fs.readdirSync(DATA_DIR)
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse()
  } catch {
    return []
  }
}

export function getOpportunities(date: string): DayData | null {
  try {
    const filePath = path.join(DATA_DIR, `${date}.json`)
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export function getLatestDate(): string | null {
  const dates = getAllDates()
  return dates.length > 0 ? dates[0] : null
}
