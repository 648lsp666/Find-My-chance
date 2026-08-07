import assert from 'node:assert/strict'
import test from 'node:test'
import { typeLine } from '../scripts/terminal-output'

function recordingStream(isTTY: boolean) {
  const writes: string[] = []
  return {
    stream: {
      isTTY,
      write(chunk: string) {
        writes.push(chunk)
        return true
      },
    },
    writes,
  }
}

test('interactive terminal displays a line as simulated typing', async () => {
  const { stream, writes } = recordingStream(true)

  await typeLine('机会', { stream, delayMs: 1 })

  assert.deepEqual(writes, ['机', '会', '\n'])
})

test('non-interactive output writes the complete line immediately', async () => {
  const { stream, writes } = recordingStream(false)

  await typeLine('生成完成', { stream, delayMs: 20 })

  assert.deepEqual(writes, ['生成完成\n'])
})
