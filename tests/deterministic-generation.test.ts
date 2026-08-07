import assert from 'node:assert/strict'
import test from 'node:test'

import { generateDeterministicReport } from '../scripts/deterministic-generation'

test('builds at most three ranked opportunities from real signals without recent duplicates', () => {
  const report = generateDeterministicReport({
    date: '2026-08-07',
    historyTitles: ['AI invoice assistant'],
    signals: [
      { source: 'GitHub', title: 'AI invoice assistant', url: 'https://example.com/duplicate', score: 900 },
      { source: 'Hacker News', title: 'Local-first team knowledge search', url: 'https://example.com/search', score: 300 },
      { source: 'Product Hunt', title: 'Browser workflow automation', url: 'https://example.com/automation', score: 200 },
      { source: 'GitHub', title: 'Developer API monitoring toolkit', url: 'https://example.com/api', score: 100 },
      { source: 'GitHub', title: 'Tiny markdown toy', url: 'https://example.com/toy', score: 1 },
    ],
  })

  assert.equal(report.opportunities.length, 3)
  assert.deepEqual(
    report.opportunities.map(opportunity => opportunity.sources[0].url),
    ['https://example.com/search', 'https://example.com/automation', 'https://example.com/api'],
  )
  assert.ok(report.opportunities.every(opportunity => opportunity.stage === '待验证'))
})
