import type { ReactNode } from 'react'

import ChatThread, { type ChatThreadProps } from '@src/components/ChatThread'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'
import DirectMessageStarter, {
  type DirectMessageStarterProps,
} from '@src/pages/chats/DirectMessageStarter'
import type {
  DirectConversationSummary,
  FlockChatSummary,
} from '@src/types/chat'

export type FlockChatListState =
  | { status: 'loading' }
  | { isRetrying: boolean; onRetry: () => void; status: 'error' }
  | {
      flocks: readonly FlockChatSummary[]
      isRefreshing: boolean
      status: 'ready'
    }

export type DirectConversationListState =
  | { status: 'loading' }
  | { isRetrying: boolean; onRetry: () => void; status: 'error' }
  | {
      conversations: readonly DirectConversationSummary[]
      isRefreshing: boolean
      status: 'ready'
    }

export type ChatsPageProps = {
  directConversations: DirectConversationListState
  flockChats: FlockChatListState
  isStartingDirectMessage: boolean
  onBackToList: () => void
  onSelectDirectConversation: (conversationId: string) => void
  onSelectFlock: (flockId: string) => void
  onStartDirectMessage: () => void
  selectedDirectConversationId?: string
  selectedFlock?: FlockChatSummary
  selectedFlockId?: string
  chat?: ChatThreadProps
  directMessageStarter?: DirectMessageStarterProps
  selectedDirectConversation?: DirectConversationSummary
}

function FlockConversationList({
  flockChats,
  onSelectFlock,
  selectedFlockId,
}: Pick<ChatsPageProps, 'flockChats' | 'onSelectFlock' | 'selectedFlockId'>) {
  return (
    <div className="px-4 py-5 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display text-base font-bold text-text">
          Flock chats
        </h2>
        {flockChats.status === 'ready' && flockChats.isRefreshing ? (
          <span className="sr-only" role="status">
            Refreshing flock chats…
          </span>
        ) : null}
      </div>

      {flockChats.status === 'loading' ? (
        <div
          className="flex min-h-24 items-center justify-center gap-2 text-sm text-text-muted"
          role="status"
        >
          <PendingIndicator className="size-4" />
          Loading flock chats…
        </div>
      ) : null}

      {flockChats.status === 'error' ? (
        <div className="py-5" role="alert">
          <p className="mt-0 mb-3 text-sm leading-5 text-text-muted">
            We could not load your flock chats.
          </p>
          <Button
            isPending={flockChats.isRetrying}
            pendingLabel="Trying again"
            variant="secondary"
            onClick={flockChats.onRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {flockChats.status === 'ready' && flockChats.flocks.length === 0 ? (
        <p className="my-4 text-sm leading-5 text-text-muted">
          Join a flock to start a group conversation.
        </p>
      ) : null}

      {flockChats.status === 'ready' && flockChats.flocks.length > 0 ? (
        <ul aria-label="Flock chats" className="mt-3 grid list-none gap-1 p-0">
          {flockChats.flocks.map((flock) => {
            const isSelected = flock.id === selectedFlockId
            return (
              <li key={flock.id}>
                <button
                  aria-current={isSelected ? 'page' : undefined}
                  className={`flex min-h-touch w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold transition-colors duration-fast ${
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : 'text-text hover:bg-background'
                  }`}
                  type="button"
                  onClick={() => onSelectFlock(flock.id)}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs ${
                      isSelected
                        ? 'bg-background/20 text-on-primary'
                        : 'bg-background text-primary-strong'
                    }`}
                  >
                    {flock.name.charAt(0).toLocaleUpperCase()}
                  </span>
                  <span className="min-w-0 truncate">{flock.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function DirectConversationList({
  directConversations,
  onSelectDirectConversation,
  onStartDirectMessage,
  selectedDirectConversationId,
}: Pick<
  ChatsPageProps,
  | 'directConversations'
  | 'onSelectDirectConversation'
  | 'onStartDirectMessage'
  | 'selectedDirectConversationId'
>) {
  return (
    <div className="border-t border-border px-4 py-5 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display text-base font-bold text-text">
          Direct messages
        </h2>
        <Button
          className="shrink-0"
          variant="ghost"
          onClick={onStartDirectMessage}
        >
          New message
        </Button>
      </div>

      {directConversations.status === 'ready' &&
      directConversations.isRefreshing ? (
        <span className="sr-only" role="status">
          Refreshing direct messages…
        </span>
      ) : null}

      {directConversations.status === 'loading' ? (
        <div
          className="flex min-h-24 items-center justify-center gap-2 text-sm text-text-muted"
          role="status"
        >
          <PendingIndicator className="size-4" />
          Loading direct messages…
        </div>
      ) : null}

      {directConversations.status === 'error' ? (
        <div className="py-5" role="alert">
          <p className="mt-0 mb-3 text-sm leading-5 text-text-muted">
            We could not load your direct messages.
          </p>
          <Button
            isPending={directConversations.isRetrying}
            pendingLabel="Trying again"
            variant="secondary"
            onClick={directConversations.onRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {directConversations.status === 'ready' &&
      directConversations.conversations.length === 0 ? (
        <p className="my-4 text-sm leading-5 text-text-muted">
          Start a private conversation with another runner.
        </p>
      ) : null}

      {directConversations.status === 'ready' &&
      directConversations.conversations.length > 0 ? (
        <ul
          aria-label="Direct messages"
          className="mt-3 grid list-none gap-1 p-0"
        >
          {directConversations.conversations.map((conversation) => {
            const isSelected = conversation.id === selectedDirectConversationId
            return (
              <li key={conversation.id}>
                <button
                  aria-current={isSelected ? 'page' : undefined}
                  className={`flex min-h-touch w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold transition-colors duration-fast ${
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : 'text-text hover:bg-background'
                  }`}
                  title={conversation.otherDisplayName}
                  type="button"
                  onClick={() => onSelectDirectConversation(conversation.id)}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs ${
                      isSelected
                        ? 'bg-background/20 text-on-primary'
                        : 'bg-background text-primary-strong'
                    }`}
                  >
                    {conversation.otherDisplayName
                      .trim()
                      .charAt(0)
                      .toLocaleUpperCase() || '?'}
                  </span>
                  <span className="min-w-0 truncate">
                    {conversation.otherDisplayName}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function ConversationList(props: ChatsPageProps) {
  return (
    <aside aria-label="Conversations" className="min-w-0 bg-surface-subtle">
      <FlockConversationList {...props} />
      <DirectConversationList {...props} />
    </aside>
  )
}

function ConversationPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-80 items-center justify-center px-6 py-12 text-center">
      <div className="max-w-sm">{children}</div>
    </div>
  )
}

function ChatsPage(props: ChatsPageProps) {
  const {
    chat,
    directConversations,
    directMessageStarter,
    flockChats,
    isStartingDirectMessage,
    onBackToList,
    selectedDirectConversation,
    selectedDirectConversationId,
    selectedFlock,
    selectedFlockId,
  } = props
  const hasSelectedConversation =
    selectedFlockId !== undefined ||
    selectedDirectConversationId !== undefined ||
    isStartingDirectMessage
  const isConversationListLoading = selectedDirectConversationId
    ? directConversations.status === 'loading'
    : flockChats.status === 'loading'

  return (
    <section
      aria-label="Chat workspace"
      className="flex h-full min-h-0 w-full flex-col py-3 sm:py-4"
    >
      <div className="min-h-0 flex-1">
        {!hasSelectedConversation ? (
          <div className="overflow-hidden rounded-lg border border-border bg-background lg:hidden">
            <ConversationList {...props} />
          </div>
        ) : null}

        {!hasSelectedConversation ? (
          <div className="hidden rounded-lg border border-border bg-background lg:block">
            <ConversationPlaceholder>
              <p className="m-0 font-display text-xl font-bold text-text">
                Choose a conversation
              </p>
              <p className="mt-2 mb-0 leading-6 text-text-muted">
                Select a flock chat or direct message from the application
                sidebar.
              </p>
            </ConversationPlaceholder>
          </div>
        ) : null}

        {hasSelectedConversation ? (
          <div className="flex h-full min-h-0 min-w-0 flex-col bg-background">
            <button
              className="mx-3 mt-2 flex min-h-touch shrink-0 cursor-pointer items-center self-start rounded-md px-2 text-sm font-bold text-text-muted hover:bg-surface-subtle hover:text-text lg:hidden"
              type="button"
              onClick={onBackToList}
            >
              ← All chats
            </button>

            {isStartingDirectMessage && directMessageStarter ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <DirectMessageStarter {...directMessageStarter} />
              </div>
            ) : null}

            {!isStartingDirectMessage &&
            !selectedFlock &&
            !selectedDirectConversation ? (
              <div className="min-h-0 flex-1">
                <ConversationPlaceholder>
                  {isConversationListLoading ? (
                    <div
                      className="flex items-center justify-center gap-3 text-text-muted"
                      role="status"
                    >
                      <PendingIndicator />
                      Loading conversation…
                    </div>
                  ) : (
                    <>
                      <p className="m-0 font-display text-xl font-bold text-text">
                        Conversation unavailable
                      </p>
                      <p className="mt-2 mb-0 leading-6 text-text-muted">
                        You do not have access to this conversation.
                      </p>
                    </>
                  )}
                </ConversationPlaceholder>
              </div>
            ) : null}

            {selectedFlock && chat ? (
              <ChatThread
                {...chat}
                description="Coordinate the next run with current flock members."
                emptyDescription="Coordinate a route, time, or meetup spot with your flock."
                messageLogLabel="Flock messages"
                placeholder="Message your flock"
                title={selectedFlock.name}
              />
            ) : null}

            {selectedDirectConversation && chat ? (
              <ChatThread
                {...chat}
                description="A private conversation between two runners."
                emptyDescription={`Send ${selectedDirectConversation.otherDisplayName} the first message.`}
                messageLogLabel={`Direct messages with ${selectedDirectConversation.otherDisplayName}`}
                placeholder={`Message ${selectedDirectConversation.otherDisplayName}`}
                title={selectedDirectConversation.otherDisplayName}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ChatsPage
