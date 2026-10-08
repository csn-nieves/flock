import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { encodeRichTextMessage } from '@src/lib/richTextMessage'
import Button from '@src/primitives/Button'

type RichTextComposerProps = {
  isSending: boolean
  onSend: (body: string) => Promise<void>
  error?: string
  label?: string
  maxLength?: number
  placeholder?: string
}

type FormatCommand = 'bold' | 'italic' | 'underline'

const formatSelectorByCommand: Record<FormatCommand, string> = {
  bold: 'b, strong',
  italic: 'em, i',
  underline: 'u',
}

const formats: ReadonlyArray<{
  command: FormatCommand
  label: string
  symbol: string
}> = [
  { command: 'bold', label: 'Bold', symbol: 'B' },
  { command: 'italic', label: 'Italic', symbol: 'I' },
  { command: 'underline', label: 'Underline', symbol: 'U' },
]

const emojis = [
  { character: '😀', label: 'Grinning face' },
  { character: '😂', label: 'Face with tears of joy' },
  { character: '😊', label: 'Smiling face' },
  { character: '👍', label: 'Thumbs up' },
  { character: '🙌', label: 'Raised hands' },
  { character: '❤️', label: 'Red heart' },
  { character: '🎉', label: 'Celebration' },
  { character: '🔥', label: 'Fire' },
  { character: '💪', label: 'Strong arm' },
  { character: '🏃', label: 'Runner' },
  { character: '👟', label: 'Running shoe' },
  { character: '🐦', label: 'Bird' },
  { character: '☀️', label: 'Sun' },
  { character: '🌧️', label: 'Rain cloud' },
  { character: '🌙', label: 'Moon' },
  { character: '📍', label: 'Location pin' },
  { character: '⏰', label: 'Alarm clock' },
  { character: '✅', label: 'Check mark' },
] as const

function SmileIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 14.25c.85 1.35 2 2 3.5 2s2.65-.65 3.5-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.75 9.5h.01M15.25 9.5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}

function RichTextComposer({
  error,
  isSending,
  label = 'Message',
  maxLength = 2000,
  onSend,
  placeholder = 'Message your flock',
}: RichTextComposerProps) {
  const labelId = useId()
  const supportId = useId()
  const pickerId = useId()
  const editorRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const emojiTriggerRef = useRef<HTMLButtonElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const acceptedNodesRef = useRef<Node[]>([])
  const [draft, setDraft] = useState('')
  const [plainDraft, setPlainDraft] = useState('')
  const [localError, setLocalError] = useState<string>()
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [activeFormats, setActiveFormats] = useState<FormatCommand[]>([])

  const visibleError = localError ?? error
  const isEmpty = !plainDraft.trim()

  const rememberSelection = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange()
    }
  }

  const restoreSelection = () => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    const selection = window.getSelection()
    const range = savedRangeRef.current
    if (!selection || !range) return
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const refreshActiveFormats = () => {
    const nextFormats = formats
      .filter(({ command }) => document.queryCommandState(command))
      .map(({ command }) => command)
    setActiveFormats(nextFormats)
  }

  const syncDraft = () => {
    const editor = editorRef.current
    if (!editor) return false

    const { body: nextDraft, plainText: nextPlainDraft } =
      encodeRichTextMessage(editor)
    if (nextDraft.length > maxLength) {
      editor.replaceChildren(
        ...acceptedNodesRef.current.map((node) => node.cloneNode(true)),
      )
      setLocalError(
        `Messages can be up to ${maxLength.toLocaleString()} characters.`,
      )
      return false
    }

    acceptedNodesRef.current = Array.from(editor.childNodes, (node) =>
      node.cloneNode(true),
    )
    setDraft(nextDraft)
    setPlainDraft(nextPlainDraft)
    setLocalError(undefined)
    rememberSelection()
    refreshActiveFormats()
    return true
  }

  const insertText = (value: string) => {
    const editor = editorRef.current
    if (!editor) return

    restoreSelection()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      editor.append(document.createTextNode(value))
    } else {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(value)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    syncDraft()
  }

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current
      const selection = window.getSelection()
      if (
        !editor ||
        !selection ||
        selection.rangeCount === 0 ||
        !editor.contains(selection.getRangeAt(0).commonAncestorContainer)
      ) {
        return
      }
      rememberSelection()
      refreshActiveFormats()
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  useEffect(() => {
    if (!isEmojiPickerOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !pickerRef.current?.contains(target) &&
        !emojiTriggerRef.current?.contains(target)
      ) {
        setIsEmojiPickerOpen(false)
      }
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsEmojiPickerOpen(false)
      emojiTriggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEmojiPickerOpen])

  const applyFormat = (command: FormatCommand) => {
    restoreSelection()
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      document.execCommand(command)
    } else {
      const commonElement =
        range.commonAncestorContainer instanceof Element
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement
      const formattedAncestor = commonElement?.closest(
        formatSelectorByCommand[command],
      )
      if (formattedAncestor && editor.contains(formattedAncestor)) {
        document.execCommand(command)
        syncDraft()
        return
      }

      const tagNameByCommand: Record<
        FormatCommand,
        keyof HTMLElementTagNameMap
      > = {
        bold: 'strong',
        italic: 'em',
        underline: 'u',
      }
      const wrapper = document.createElement(tagNameByCommand[command])
      wrapper.append(range.extractContents())
      range.insertNode(wrapper)
      range.selectNodeContents(wrapper)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    syncDraft()
  }

  const clearComposer = () => {
    const editor = editorRef.current
    if (editor) editor.replaceChildren()
    acceptedNodesRef.current = []
    savedRangeRef.current = null
    setDraft('')
    setPlainDraft('')
    setActiveFormats([])
  }

  const submitMessage = async (event?: FormEvent) => {
    event?.preventDefault()
    if (isEmpty) {
      setLocalError('Write a message before sending.')
      editorRef.current?.focus()
      return
    }

    setLocalError(undefined)
    try {
      await onSend(draft.trim())
      clearComposer()
    } catch {
      // The route supplies a durable mutation error and the draft stays intact.
    }
  }

  const onEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const modifier = event.metaKey || event.ctrlKey
    if (modifier && ['b', 'i', 'u'].includes(event.key.toLocaleLowerCase())) {
      event.preventDefault()
      const commandByKey: Record<string, FormatCommand> = {
        b: 'bold',
        i: 'italic',
        u: 'underline',
      }
      applyFormat(commandByKey[event.key.toLocaleLowerCase()] ?? 'bold')
      return
    }

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      void submitMessage()
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    insertText(event.clipboardData.getData('text/plain'))
  }

  const supportingContent: ReactNode = visibleError ? (
    <p className="m-0 font-medium text-text" role="alert">
      <span className="text-accent">Error:</span> {visibleError}
    </p>
  ) : null

  return (
    <form
      className="relative shrink-0 border-t border-border bg-background px-3 py-3 sm:px-5"
      noValidate
      onSubmit={(event) => void submitMessage(event)}
    >
      <div className="rich-text-composer-frame overflow-hidden rounded-lg border border-border bg-background transition-[border-color,box-shadow] duration-fast ease-out">
        <div
          aria-label="Message formatting"
          className="flex min-h-touch items-center border-b border-border bg-surface-subtle px-1.5"
          role="toolbar"
        >
          {formats.map((format) => {
            const isActive = activeFormats.includes(format.command)
            return (
              <button
                aria-label={format.label}
                aria-pressed={isActive}
                className={`flex size-11 cursor-pointer items-center justify-center rounded-sm text-base text-text-muted transition-colors duration-fast hover:bg-background hover:text-text disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? 'bg-background text-primary-strong shadow-sm' : ''} ${format.command === 'bold' ? 'font-bold' : ''} ${format.command === 'italic' ? 'italic' : ''} ${format.command === 'underline' ? 'underline underline-offset-2' : ''}`}
                disabled={isSending}
                key={format.command}
                type="button"
                onClick={() => applyFormat(format.command)}
                onMouseDown={(event) => event.preventDefault()}
              >
                {format.symbol}
              </button>
            )
          })}
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
          <button
            aria-controls={pickerId}
            aria-expanded={isEmojiPickerOpen}
            aria-haspopup="dialog"
            aria-label="Add emoji"
            className={`flex size-11 cursor-pointer items-center justify-center rounded-sm text-text-muted transition-colors duration-fast hover:bg-background hover:text-text disabled:cursor-not-allowed disabled:opacity-50 ${isEmojiPickerOpen ? 'bg-background text-primary-strong shadow-sm' : ''}`}
            disabled={isSending}
            ref={emojiTriggerRef}
            type="button"
            onClick={() => {
              rememberSelection()
              setIsEmojiPickerOpen((current) => !current)
            }}
          >
            <SmileIcon />
          </button>
        </div>

        <label className="sr-only" id={labelId}>
          {label}
        </label>
        <div
          aria-describedby={supportId}
          aria-disabled={isSending}
          aria-invalid={visibleError ? true : undefined}
          aria-labelledby={labelId}
          aria-multiline="true"
          className="rich-text-composer max-h-36 min-h-20 cursor-text overflow-y-auto px-3 py-2 text-base leading-6 text-text outline-none disabled:cursor-not-allowed"
          contentEditable={!isSending}
          data-placeholder={placeholder}
          ref={editorRef}
          role="textbox"
          suppressContentEditableWarning
          onBlur={rememberSelection}
          onInput={syncDraft}
          onKeyDown={onEditorKeyDown}
          onPaste={onPaste}
        />
      </div>

      {isEmojiPickerOpen ? (
        <div
          aria-label="Choose an emoji"
          className="absolute bottom-[calc(100%_-_0.25rem)] left-3 z-[var(--flock-z-popover)] w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-background p-2 shadow-floating sm:left-5"
          id={pickerId}
          ref={pickerRef}
          role="dialog"
        >
          <p className="mt-1 mb-2 px-1 font-display text-sm font-bold text-text">
            Emoji
          </p>
          <div className="grid grid-cols-6 gap-0.5">
            {emojis.map((emoji) => (
              <button
                aria-label={`Add ${emoji.label}`}
                className="flex size-11 cursor-pointer items-center justify-center rounded-md text-xl hover:bg-surface-subtle"
                key={emoji.label}
                type="button"
                onClick={() => {
                  insertText(emoji.character)
                  setIsEmojiPickerOpen(false)
                }}
              >
                {emoji.character}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className="mt-2 flex min-h-5 items-start justify-between gap-3 text-sm leading-5"
        id={supportId}
      >
        <div>{supportingContent}</div>
        <span className="ml-auto shrink-0 text-right tabular-nums text-text-muted">
          {plainDraft.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          disabled={isEmpty}
          isPending={isSending}
          pendingLabel="Sending message"
          type="submit"
        >
          Send message
        </Button>
      </div>
    </form>
  )
}

export default RichTextComposer
