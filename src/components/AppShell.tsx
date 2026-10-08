import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { ConversationSummary } from '@src/components/ConversationSummary'
import { getConversationAccessibleLabel } from '@src/lib/conversationActivity'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useConversationDirectorySync } from '@src/hooks/useConversationDirectorySync'
import { useDirectConversations } from '@src/hooks/useDirectConversations'
import { useFlockChats } from '@src/hooks/useFlockChats'
import { useProfile } from '@src/hooks/useProfile'
import { usePushSubscriptionRefresh } from '@src/hooks/usePushSubscriptionRefresh'
import ComposeMessageIcon from '@src/primitives/icons/ComposeMessageIcon'
import type {
  DirectConversationSummary,
  FlockChatSummary,
} from '@src/types/chat'

const navigation = [
  { label: 'Flocks', to: '/flocks' },
  { label: 'Events', to: '/events' },
  { label: 'Discover', to: '/discover' },
]

function NavigationLink({ label, to }: { label: string; to: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'flex min-h-touch items-center rounded-md px-3 text-sm font-bold transition-colors duration-fast',
          isActive
            ? 'bg-primary text-on-primary'
            : 'text-text-muted hover:bg-surface-subtle hover:text-text',
        ].join(' ')
      }
      end={to === '/flocks'}
      to={to}
    >
      {label}
    </NavLink>
  )
}

export function ConversationNavigation({
  currentUserId,
  directConversations,
  flocks,
  isDirectError,
  isDirectPending,
  isDirectRefreshing,
  isError,
  isPending,
  isRefreshing,
  onNavigate,
}: {
  currentUserId: string
  directConversations?: readonly DirectConversationSummary[]
  flocks?: readonly FlockChatSummary[]
  isDirectError: boolean
  isDirectPending: boolean
  isDirectRefreshing: boolean
  isError: boolean
  isPending: boolean
  isRefreshing: boolean
  onNavigate?: () => void
}) {
  return (
    <nav
      aria-label="Chat conversations"
      className="min-w-0 overflow-hidden border-t border-border pt-5"
    >
      <div className="flex items-center justify-between gap-2 px-3">
        <h2 className="m-0 font-display text-sm font-bold text-text">
          Flock chats
        </h2>
        {isRefreshing && flocks ? (
          <span className="sr-only" role="status">
            Refreshing flock chats…
          </span>
        ) : null}
      </div>

      {isPending ? (
        <p className="mt-3 mb-0 px-3 text-xs text-text-muted" role="status">
          Loading chats…
        </p>
      ) : null}
      {isError ? (
        <p className="mt-3 mb-0 px-3 text-xs leading-4 text-text-muted">
          Chats unavailable
        </p>
      ) : null}
      {flocks?.length === 0 ? (
        <p className="mt-3 mb-0 px-3 text-xs leading-4 text-text-muted">
          Join a flock to start chatting.
        </p>
      ) : null}
      {flocks && flocks.length > 0 ? (
        <ul
          aria-label="Flock chat conversations"
          className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)] list-none gap-1 p-0"
        >
          {flocks.map((flock) => (
            <li className="min-w-0" key={flock.id}>
              <NavLink
                className={({ isActive }) =>
                  `flex min-h-touch w-full min-w-0 items-center overflow-hidden rounded-md px-3 transition-colors duration-fast ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'text-text-muted hover:bg-background hover:text-text'
                  }`
                }
                aria-label={getConversationAccessibleLabel(
                  flock.name,
                  flock,
                  currentUserId,
                )}
                title={flock.name}
                to={`/chats/${encodeURIComponent(flock.id)}`}
                onClick={onNavigate}
              >
                {({ isActive }) => (
                  <ConversationSummary
                    activity={flock}
                    currentUserId={currentUserId}
                    isSelected={isActive}
                    title={flock.name}
                  />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 border-t border-border px-3 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 font-display text-sm font-bold text-text">
            Direct messages
          </h2>
          <NavLink
            aria-label="New direct message"
            className="flex size-12 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors duration-fast hover:bg-background hover:text-text lg:size-11"
            title="New direct message"
            to="/chats/direct/new"
            onClick={onNavigate}
          >
            <ComposeMessageIcon className="size-[22px] shrink-0 lg:size-5" />
          </NavLink>
        </div>
        {isDirectRefreshing && directConversations ? (
          <span className="sr-only" role="status">
            Refreshing direct messages…
          </span>
        ) : null}
        {isDirectPending ? (
          <p className="mt-3 mb-0 text-xs text-text-muted" role="status">
            Loading direct messages…
          </p>
        ) : null}
        {isDirectError ? (
          <p className="mt-3 mb-0 text-xs leading-4 text-text-muted">
            Direct messages unavailable
          </p>
        ) : null}
        {directConversations?.length === 0 ? (
          <p className="mt-3 mb-0 text-xs leading-4 text-text-muted">
            Start a private conversation.
          </p>
        ) : null}
        {directConversations && directConversations.length > 0 ? (
          <ul
            aria-label="Direct message conversations"
            className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)] list-none gap-1 p-0"
          >
            {directConversations.map((conversation) => (
              <li className="min-w-0" key={conversation.id}>
                <NavLink
                  className={({ isActive }) =>
                    `flex min-h-touch w-full min-w-0 items-center overflow-hidden rounded-md px-3 transition-colors duration-fast ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'text-text-muted hover:bg-background hover:text-text'
                    }`
                  }
                  aria-label={getConversationAccessibleLabel(
                    conversation.otherDisplayName,
                    conversation,
                    currentUserId,
                  )}
                  title={conversation.otherDisplayName}
                  to={`/chats/direct/${encodeURIComponent(conversation.id)}`}
                  onClick={onNavigate}
                >
                  {({ isActive }) => (
                    <ConversationSummary
                      activity={conversation}
                      currentUserId={currentUserId}
                      isSelected={isActive}
                      title={conversation.otherDisplayName}
                    />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </nav>
  )
}

function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { session } = useAuthSession()
  const flocksQuery = useFlockChats()
  const directConversationsQuery = useDirectConversations()
  const profileQuery = useProfile()
  useConversationDirectorySync(session?.user.id)
  usePushSubscriptionRefresh()
  const isChatRoute = location.pathname.startsWith('/chats')
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const displayName =
    session?.user.user_metadata?.display_name ??
    session?.user.user_metadata?.full_name ??
    'Your profile'
  const firstName = displayName.trim().split(/\s+/)[0] || 'Profile'
  const initial = firstName.charAt(0).toLocaleUpperCase() || 'P'
  const profileAvatar = profileQuery.data?.avatarUrl ?? null

  useEffect(() => {
    if (!isMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div
      className={`flex flex-col lg:flex-row ${isChatRoute ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}
    >
      <header className="border-b border-border bg-background lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4">
          <NavLink
            aria-label="Flock home"
            className="flex items-center gap-2 font-display text-lg font-bold text-text"
            to="/flocks"
          >
            <img
              alt=""
              className="size-8 rounded-md"
              src="/icons/flock-mark.svg"
            />
            Flock
          </NavLink>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex size-11 items-center justify-center rounded-md text-text hover:bg-surface-subtle"
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="grid gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>
        {isMenuOpen ? (
          <>
            <button
              aria-label="Close menu"
              className="fixed inset-0 z-30 bg-text/20"
              type="button"
              onClick={closeMenu}
            />
            <nav
              aria-label="Mobile navigation"
              className="absolute inset-x-0 z-40 border-b border-border bg-background px-4 py-4 shadow-floating"
              id="mobile-navigation"
            >
              <div className="grid gap-2">
                {navigation.map((item) => (
                  <div key={item.to} onClick={closeMenu}>
                    <NavigationLink {...item} />
                  </div>
                ))}
                {isSuperadmin ? (
                  <NavigationLink label="Admin" to="/admin" />
                ) : null}
              </div>
              <div className="mt-5">
                <ConversationNavigation
                  currentUserId={session?.user.id ?? ''}
                  directConversations={directConversationsQuery.data}
                  flocks={flocksQuery.data}
                  isDirectError={directConversationsQuery.isError}
                  isDirectPending={directConversationsQuery.isPending}
                  isDirectRefreshing={directConversationsQuery.isFetching}
                  isError={flocksQuery.isError}
                  isPending={flocksQuery.isPending}
                  isRefreshing={flocksQuery.isFetching}
                  onNavigate={closeMenu}
                />
              </div>
              <div className="mt-4 grid gap-2 border-t border-border pt-4">
                <div onClick={closeMenu}>
                  <NavLink
                    aria-label={`Open ${displayName} profile`}
                    className="flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-text hover:bg-surface-subtle"
                    to="/profile"
                  >
                    {profileAvatar ? (
                      <img
                        alt=""
                        className="size-9 shrink-0 rounded-full object-cover"
                        src={profileAvatar}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-on-primary"
                      >
                        {initial}
                      </span>
                    )}
                    <span className="min-w-0 truncate">{firstName}</span>
                  </NavLink>
                </div>
                <div onClick={closeMenu}>
                  <NavigationLink label="Settings" to="/settings" />
                </div>
              </div>
            </nav>
          </>
        ) : null}
      </header>

      <aside className="sticky top-0 hidden h-dvh max-h-dvh w-60 shrink-0 self-start overflow-y-auto border-r border-border bg-surface-subtle lg:flex lg:flex-col lg:p-5">
        <NavLink
          aria-label="Flock home"
          className="flex items-center gap-3 font-display text-xl font-bold text-text"
          to="/flocks"
        >
          <img
            alt=""
            className="size-10 rounded-lg"
            src="/icons/flock-mark.svg"
          />
          Flock
        </NavLink>
        <nav aria-label="Main navigation" className="mt-10 grid gap-2">
          {navigation.map((item) => (
            <NavigationLink key={item.to} {...item} />
          ))}
          {isSuperadmin ? <NavigationLink label="Admin" to="/admin" /> : null}
        </nav>
        <div className="mt-6">
          <ConversationNavigation
            currentUserId={session?.user.id ?? ''}
            directConversations={directConversationsQuery.data}
            flocks={flocksQuery.data}
            isDirectError={directConversationsQuery.isError}
            isDirectPending={directConversationsQuery.isPending}
            isDirectRefreshing={directConversationsQuery.isFetching}
            isError={flocksQuery.isError}
            isPending={flocksQuery.isPending}
            isRefreshing={flocksQuery.isFetching}
          />
        </div>
        <div className="mt-auto grid gap-2 border-t border-border pt-4">
          <NavLink
            aria-label={`Open ${displayName} profile`}
            className="flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-text hover:bg-background"
            to="/profile"
          >
            {profileAvatar ? (
              <img
                alt=""
                className="size-9 shrink-0 rounded-full object-cover"
                src={profileAvatar}
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-on-primary"
              >
                {initial}
              </span>
            )}
            <span className="min-w-0 truncate">{firstName}</span>
          </NavLink>
          <NavigationLink label="Settings" to="/settings" />
        </div>
      </aside>

      <div
        className={`min-w-0 flex-1 ${isChatRoute ? 'min-h-0 overflow-hidden' : ''}`}
      >
        <div
          className={`w-full px-4 sm:px-8 lg:px-10 ${isChatRoute ? 'h-full' : 'mx-auto max-w-4xl'}`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppShell
