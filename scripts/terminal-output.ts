interface TerminalStream {
  isTTY?: boolean
  write(chunk: string): unknown
}

interface TypeLineOptions {
  stream?: TerminalStream
  delayMs?: number
}

const wait = (delayMs: number) =>
  new Promise<void>(resolve => setTimeout(resolve, delayMs))

export async function typeLine(
  text: string,
  {
    stream = process.stdout,
    delayMs = Number(process.env.TYPEWRITER_DELAY_MS ?? 18),
  }: TypeLineOptions = {},
) {
  if (!stream.isTTY || delayMs <= 0) {
    stream.write(`${text}\n`)
    return
  }

  for (const character of text) {
    stream.write(character)
    await wait(delayMs)
  }
  stream.write('\n')
}
