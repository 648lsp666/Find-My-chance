import assert from 'node:assert/strict'
import test from 'node:test'

import { requestOpenAIJson } from '../scripts/openai-generation'

test('requests schema-constrained JSON from the OpenAI Responses API', async () => {
  let request: { url?: string; init?: RequestInit } = {}
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    request = { url: String(url), init }
    return new Response(JSON.stringify({
      output: [{
        type: 'message',
        content: [{ type: 'output_text', text: '{"opportunities":[]}' }],
      }],
    }), { status: 200 })
  }

  const result = await requestOpenAIJson({
    apiKey: 'test-key',
    model: 'gpt-5.6-terra',
    prompt: 'Generate opportunities',
    schemaName: 'daily_opportunities',
    schema: {
      type: 'object',
      properties: { opportunities: { type: 'array', items: {} } },
      required: ['opportunities'],
      additionalProperties: false,
    },
    fetchImpl,
  })

  assert.deepEqual(result, { opportunities: [] })
  assert.equal(request.url, 'https://api.openai.com/v1/responses')
  assert.equal((request.init?.headers as Record<string, string>).Authorization, 'Bearer test-key')

  const body = JSON.parse(String(request.init?.body))
  assert.equal(body.model, 'gpt-5.6-terra')
  assert.equal(body.input, 'Generate opportunities')
  assert.equal(body.text.format.type, 'json_schema')
  assert.equal(body.text.format.strict, true)
})
