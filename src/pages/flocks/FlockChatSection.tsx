import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import RichTextComposer from '@src/components/RichTextComposer'
import {
  decodeRichTextMessage,
  type RichTextRun,
} from '@src/lib/richTextMessage'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import type { FlockChatConnectionStatus, FlockMessage } from '@src/types/chat'

export type FlockChatSectionProps = {
  connectionStatus: FlockChatConnectionStatus
  currentUserId: string
  hasOlderMessages: boolean
  isLoading: boolean
  isLoadingOlderMessages: boolean
  isSending: boolean
  messages: FlockMessage[]
  onLoadOlderMessages: () => Promise<void>
  onRetry: () => void
  onSend: (body: string) => Promise<void>
  description?: string
  error?: string
  sendError?: string
  title?: string
}

const maxMessageLength = 2000
const nearBottomDistance = 72

const inlineMarkers = [
  {
    close: '***',
    open: '***',
    render: (children: ReactNode) => (
      <strong>
        <em>{children}</em>
      </strong>
    ),
  },
  {
    close: '**',
    open: '**',
    render: (children: ReactNode) => <strong>{children}</strong>,
  },
  {
    close: '__',
    open: '__',
    render: (children: ReactNode) => <u>{children}</u>,
  },
  {
    close: '*',
    open: '*',
    render: (children: ReactNode) => <em>{children}</em>,
  },
] as const

function formatLegacyMessageBody(
  value: string,
  keyPrefix = 'message',
): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0
  let textStart = 0

  while (cursor < value.length) {
    const marker = inlineMarkers.find(({ open }) =>
      value.startsWith(open, cursor),
    )
    if (!marker) {
      cursor += 1
      continue
    }

    const closingIndex = value.indexOf(
      marker.close,
      cursor + marker.open.length,
    )
    if (closingIndex < 0) {
      cursor += marker.open.length
      continue
    }

    if (textStart < cursor) nodes.push(value.slice(textStart, cursor))
    const contents = value.slice(cursor + marker.open.length, closingIndex)
    nodes.push(
      <span key={`${keyPrefix}-${cursor}`}>
        {marker.render(
          formatLegacyMessageBody(contents, `${keyPrefix}-${cursor}`),
        )}
      </span>,
    )
    cursor = closingIndex + marker.close.length
    textStart = cursor
  }

  if (textStart < value.length) nodes.push(value.slice(textStart))
  return nodes
}

function renderRichTextRun(run: RichTextRun, key: number) {
  let contents: ReactNode = run.text
  if (run.underline) contents = <u>{contents}</u>
  if (run.italic) contents = <em>{contents}</em>
  if (run.bold) contents = <strong>{contents}</strong>
  return <span key={key}>{contents}</span>
}

function formatMessageBody(value: string): ReactNode[] {
  const runs = decodeRichTextMessage(value)
  if (runs) return runs.map(renderRichTextRun)
  return formatLegacyMessageBody(value)
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function FlockChatSection({
  connectionStatus,
  currentUserId,
  description = 'Plan the next run with current flock members.',
  error,
  hasOlderMessages,
  isLoading,
  isLoadingOlderMessages,
  isSending,
  messages,
  onLoadOlderMessages,
  onRetry,
  onSend,
  sendError,
  title = 'Flock chat',
}: FlockChatSectionProps) {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const isLoadingOlderRef = useRef(false)
  const prependSnapshotRef = useRef<
    | {
        scrollHeight: number
        scrollTop: number
      }
    | undefined
  >(undefined)
  const previousFirstMessageIdRef = useRef<string | undefined>(undefined)
  const previousLastMessageIdRef = useRef<string | undefined>(undefined)
  const isInitializedRef = useRef(false)
  const firstMessageId = messages.at(0)?.id
  const lastMessage = messages.at(-1)
  let connectionLabel = 'Connecting…'
  if (connectionStatus === 'live') connectionLabel = 'Live'
  if (connectionStatus === 'paused') connectionLabel = 'Updates paused'

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return
    if (behavior === 'smooth' && typeof scrollArea.scrollTo === 'function') {
      scrollArea.scrollTo({ behavior, top: scrollArea.scrollHeight })
    } else {
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
    isNearBottomRef.current = true
    setHasUnreadMessages(false)
  }

  const loadOlderMessages = async () => {
    const scrollArea = scrollAreaRef.current
    if (
      !scrollArea ||
      !hasOlderMessages ||
      isLoadingOlderMessages ||
      isLoadingOlderRef.current
    ) {
      return
    }

    isLoadingOlderRef.current = true
    prependSnapshotRef.current = {
      scrollHeight: scrollArea.scrollHeight,
      scrollTop: scrollArea.scrollTop,
    }
    try {
      await onLoadOlderMessages()
    } finally {
      isLoadingOlderRef.current = false
    }
  }

  useEffect(() => {
    const root = scrollAreaRef.current
    const sentinel = sentinelRef.current
    if (
      !root ||
      !sentinel ||
      !hasOlderMessages ||
      isLoading ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadOlderMessages()
      },
      { root, rootMargin: '96px 0px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  })

  useLayoutEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea || isLoading) return

    if (!isInitializedRef.current) {
      scrollToBottom('auto')
      isInitializedRef.current = true
    } else if (
      prependSnapshotRef.current &&
      previousFirstMessageIdRef.current !== firstMessageId
    ) {
      const snapshot = prependSnapshotRef.current
      scrollArea.scrollTop =
        snapshot.scrollTop + scrollArea.scrollHeight - snapshot.scrollHeight
      prependSnapshotRef.current = undefined
    } else if (
      previousLastMessageIdRef.current !== lastMessage?.id &&
      lastMessage
    ) {
      if (isNearBottomRef.current || lastMessage.senderId === currentUserId) {
        scrollToBottom(
          lastMessage.senderId === currentUserId ? 'smooth' : 'auto',
        )
      } else {
        setHasUnreadMessages(true)
      }
    }

    previousFirstMessageIdRef.current = firstMessageId
    previousLastMessageIdRef.current = lastMessage?.id
  }, [currentUserId, firstMessageId, isLoading, lastMessage])

  return (
    <section
      aria-labelledby="flock-chat-heading"
      className="flex h-full min-h-0 min-w-0 flex-col"
      id="flock-chat"
    >
      <div className="flex shrink-0 items-end justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2
            className="m-0 font-display text-xl leading-7 font-bold text-text"
            id="flock-chat-heading"
          >
            {title}
          </h2>
          <p className="mt-1 mb-0 text-sm leading-5 text-text-muted">
            {description}
          </p>
        </div>
        {!isLoading && !error ? (
          <p
            aria-live="polite"
            className="m-0 shrink-0 text-xs font-bold text-text-muted"
          >
            {connectionLabel}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {isLoading ? (
          <div
            className="flex min-h-0 flex-1 items-center justify-center gap-3 text-text-muted"
            role="status"
          >
            <PendingIndicator />
            <span>Loading messages…</span>
          </div>
        ) : null}
        {!isLoading && error ? (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center"
            role="alert"
          >
            <p className="mt-0 mb-4 text-sm leading-5 text-text">{error}</p>
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : null}
        {!isLoading && !error ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <div
                aria-label="Flock messages"
                className="h-full min-h-0 overflow-y-auto px-2 py-3 sm:px-4"
                ref={scrollAreaRef}
                role="log"
                onScroll={(event) => {
                  const element = event.currentTarget
                  isNearBottomRef.current =
                    element.scrollHeight -
                      element.scrollTop -
                      element.clientHeight <
                    nearBottomDistance
                  if (isNearBottomRef.current) setHasUnreadMessages(false)
                }}
              >
                <div aria-hidden="true" className="h-px" ref={sentinelRef} />
                {isLoadingOlderMessages ? (
                  <div
                    className="flex justify-center gap-2 pb-3 text-xs text-text-muted"
                    role="status"
                  >
                    <PendingIndicator className="size-3" />
                    Loading earlier messages…
                  </div>
                ) : null}
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-24 items-center justify-center px-6 text-center">
                    <div>
                      <p className="m-0 font-display text-lg font-bold text-text">
                        Start the conversation
                      </p>
                      <p className="mt-2 mb-0 max-w-xs text-sm leading-5 text-text-muted">
                        Coordinate a route, time, or meetup spot with your
                        flock.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ol className="m-0 flex list-none flex-col gap-1 p-0">
                    {messages.map((message) => {
                      const isOwnMessage = message.senderId === currentUserId
                      const senderInitial = message.senderDisplayName
                        .trim()
                        .charAt(0)
                        .toLocaleUpperCase()
                      return (
                        <li
                          className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-subtle"
                          key={message.id}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex size-9 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold ${isOwnMessage ? 'bg-primary text-on-primary' : 'bg-surface-subtle text-primary-strong group-hover:bg-background'}`}
                          >
                            {senderInitial || '?'}
                          </span>
                          <article className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <p className="m-0 font-display text-sm leading-5 font-bold text-text">
                                {isOwnMessage
                                  ? 'You'
                                  : message.senderDisplayName}
                              </p>
                              <time
                                className="text-[0.6875rem] text-text-muted"
                                dateTime={message.createdAt}
                              >
                                {formatMessageTime(message.createdAt)}
                              </time>
                            </div>
                            <p className="mt-0.5 mb-0 whitespace-pre-wrap text-base leading-6 break-words text-text">
                              {formatMessageBody(message.body)}
                            </p>
                          </article>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
              {hasUnreadMessages ? (
                <Button
                  className="absolute right-3 bottom-3 shadow-sm"
                  variant="secondary"
                  onClick={() => scrollToBottom()}
                >
                  New messages
                </Button>
              ) : null}
            </div>

            {connectionStatus === 'paused' ? (
              <div
                className="border-t border-border bg-surface-subtle px-4 py-3 text-sm leading-5 text-text"
                role="status"
              >
                Live updates are paused. New messages may be delayed.{' '}
                <button
                  className="cursor-pointer font-bold underline underline-offset-2"
                  type="button"
                  onClick={onRetry}
                >
                  Refresh messages
                </button>
              </div>
            ) : null}

            <RichTextComposer
              error={sendError}
              isSending={isSending}
              maxLength={maxMessageLength}
              onSend={onSend}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default FlockChatSection
