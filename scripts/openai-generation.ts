interface OpenAIJsonRequest {
  apiKey: string
  model: string
  prompt: string
  schemaName: string
  schema: Record<string, unknown>
  maxOutputTokens?: number
  fetchImpl?: typeof fetch
}

export async function requestOpenAIJson<T = unknown>({
  apiKey,
  model,
  prompt,
  schemaName,
  schema,
  maxOutputTokens = 16384,
  fetchImpl = fetch,
}: OpenAIJsonRequest): Promise<T> {
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API ${response.status}: ${error}`)
  }

  const json: any = await response.json()
  const text = json.output_text
    ?? json.output
      ?.flatMap((item: any) => item.content ?? [])
      .find((item: any) => item.type === 'output_text')
      ?.text

  if (!text) throw new Error('OpenAI response did not contain output text')
  return JSON.parse(text) as T
}
