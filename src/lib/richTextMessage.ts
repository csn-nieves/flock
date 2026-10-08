export type RichTextRun = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

const richTextPrefix = 'flock-rich:v1:'
const boldFlag = 1
const italicFlag = 2
const underlineFlag = 4
const supportedFlags = boldFlag | italicFlag | underlineFlag

type EncodedRun = [text: string, flags: number]

function appendRun(runs: EncodedRun[], text: string, flags: number) {
  if (!text) return

  const previous = runs.at(-1)
  if (previous?.[1] === flags) {
    previous[0] += text
  } else {
    runs.push([text, flags])
  }
}

function collectRuns(node: Node, inheritedFlags: number, runs: EncodedRun[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    appendRun(runs, node.textContent ?? '', inheritedFlags)
    return
  }
  if (!(node instanceof HTMLElement)) return

  if (node.tagName === 'BR') {
    appendRun(runs, '\n', inheritedFlags)
    return
  }

  let flags = inheritedFlags
  if (node.tagName === 'STRONG' || node.tagName === 'B') flags |= boldFlag
  if (node.tagName === 'EM' || node.tagName === 'I') flags |= italicFlag
  if (node.tagName === 'U') flags |= underlineFlag

  Array.from(node.childNodes).forEach((child) =>
    collectRuns(child, flags, runs),
  )
  if (node.tagName === 'DIV' || node.tagName === 'P') {
    appendRun(runs, '\n', inheritedFlags)
  }
}

export function encodeRichTextMessage(editor: HTMLElement) {
  const runs: EncodedRun[] = []
  Array.from(editor.childNodes).forEach((child) => collectRuns(child, 0, runs))

  const finalRun = runs.at(-1)
  if (finalRun?.[0].endsWith('\n')) finalRun[0] = finalRun[0].slice(0, -1)
  if (finalRun?.[0] === '') runs.pop()

  const plainText = runs.map(([text]) => text).join('')
  const hasFormatting = runs.some(([, flags]) => flags !== 0)
  const body =
    hasFormatting || plainText.startsWith(richTextPrefix)
      ? `${richTextPrefix}${JSON.stringify(runs)}`
      : plainText

  return { body, plainText }
}

export function decodeRichTextMessage(value: string): RichTextRun[] | null {
  if (!value.startsWith(richTextPrefix)) return null

  try {
    const candidate: unknown = JSON.parse(value.slice(richTextPrefix.length))
    if (!Array.isArray(candidate)) return null

    return candidate.map((run) => {
      if (
        !Array.isArray(run) ||
        run.length !== 2 ||
        typeof run[0] !== 'string' ||
        typeof run[1] !== 'number' ||
        !Number.isInteger(run[1]) ||
        run[1] < 0 ||
        (run[1] & ~supportedFlags) !== 0
      ) {
        throw new Error('Invalid rich-text run')
      }

      return {
        text: run[0],
        bold: Boolean(run[1] & boldFlag) || undefined,
        italic: Boolean(run[1] & italicFlag) || undefined,
        underline: Boolean(run[1] & underlineFlag) || undefined,
      }
    })
  } catch {
    return null
  }
}

export function getPlainTextMessage(value: string) {
  const runs = decodeRichTextMessage(value)
  return runs ? runs.map(({ text }) => text).join('') : value
}
