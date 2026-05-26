#!/usr/bin/env tsx
/**
 * Backfill historical opportunity data for past N days.
 *
 * Usage:
 *   npx tsx scripts/backfill.ts --days 7          # backfill last 7 days
 *   npx tsx scripts/backfill.ts --date 2026-05-20  # single specific date
 *   npx tsx scripts/backfill.ts --days 7 --force   # overwrite existing files
 *
 * Reuses generate-daily.ts logic by setting TARGET_DATE + FORCE_GENERATE env vars
 * and spawning it as a subprocess for each date.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : undefined
}

const days = parseInt(getArg('--days') ?? '7', 10)
const singleDate = getArg('--date')
const force = args.includes('--force')

function datesBetween(daysBack: number): string[] {
  const dates: string[] = []
  for (let i = daysBack; i >= 1; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    dates.push(d.toLocaleString('sv', { timeZone: 'Asia/Shanghai' }).slice(0, 10))
  }
  return dates
}

const targets = singleDate ? [singleDate] : datesBetween(days)
const outDir = join(process.cwd(), 'data', 'opportunities')

console.log(`Backfilling ${targets.length} date(s): ${targets[0]} → ${targets[targets.length - 1]}`)
console.log('')

let succeeded = 0
let skipped = 0
let failed = 0

for (const date of targets) {
  const outPath = join(outDir, `${date}.json`)
  if (existsSync(outPath) && !force) {
    console.log(`  ⏭ ${date} — already exists (use --force to overwrite)`)
    skipped++
    continue
  }

  console.log(`  ▶ Generating ${date}…`)
  try {
    execSync(`npx tsx scripts/generate-daily.ts`, {
      env: {
        ...process.env,
        TARGET_DATE: date,
        FORCE_GENERATE: '1',
        // Override date output to use TARGET_DATE
        BACKFILL_DATE: date,
      },
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    succeeded++
  } catch (err: any) {
    console.error(`  ✗ ${date} failed: ${err.message ?? err}`)
    failed++
  }
  console.log('')
}

console.log(`\nDone. ✓ ${succeeded} generated, ⏭ ${skipped} skipped, ✗ ${failed} failed`)
