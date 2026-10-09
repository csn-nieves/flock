import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'

import { ConversationSummary } from '@src/components/ConversationSummary'
import ProfileAvatar from '@src/components/ProfileAvatar'
import { getConversationAccessibleLabel } from '@src/lib/conversationActivity'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useConversationDirectorySync } from '@src/hooks/useConversationDirectorySync'
import { useDirectConversations } from '@src/hooks/useDirectConversations'
import { useFlockChats } from '@src/hooks/useFlockChats'
import { useProfile } from '@src/hooks/useProfile'
import { usePushSubscriptionRefresh } from '@src/hooks/usePushSubscriptionRefresh'
import { useNotifications } from '@src/hooks/useNotifications'
import BellIcon from '@src/primitives/icons/BellIcon'
import ComposeMessageIcon from '@src/primitives/icons/ComposeMessageIcon'
import ProfileIcon from '@src/primitives/icons/ProfileIcon'
import SettingsIcon from '@src/primitives/icons/SettingsIcon'
import SignOutIcon from '@src/primitives/icons/SignOutIcon'
import Button from '@src/primitives/Button'
import { signOut } from '@src/data/auth'
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
          'flex min-h-touch items-center rounded-md px-3 text-sm font-bold transition-colors duration-fast lg:min-h-0 lg:py-1',
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

function SettingsNavigationLink({ onClick }: { onClick?: () => void }) {
  return (
    <NavLink
      aria-label="Settings"
      className="flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-text transition-colors duration-fast hover:bg-surface-subtle lg:min-h-0 lg:py-1"
      to="/settings"
      onClick={onClick}
    >
      <span className="flex size-9 shrink-0 items-center justify-center">
        <SettingsIcon className="size-5" />
      </span>
      <span>Settings</span>
    </NavLink>
  )
}

function SignOutControl({
  error,
  isPending,
  onSignOut,
}: {
  error?: string
  isPending: boolean
  onSignOut: () => void
}) {
  return (
    <div>
      <Button
        aria-busy={isPending || undefined}
        className="w-full justify-start gap-3 px-3 text-sm lg:min-h-0 lg:py-1"
        disabled={isPending}
        variant="danger"
        onClick={onSignOut}
      >
        <span className="flex size-9 shrink-0 items-center justify-center">
          <SignOutIcon className="size-5" />
        </span>
        {isPending ? 'Signing out…' : 'Sign out'}
      </Button>
      {error ? (
        <p className="mt-1 px-3 text-xs leading-4 text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function AccountMenu({
  displayName,
  initial,
  isOpen,
  isPending,
  profileAvatar,
  signOutError,
  onClose,
  onSignOut,
  onToggle,
}: {
  displayName: string
  initial: string
  isOpen: boolean
  isPending: boolean
  profileAvatar: string | null
  signOutError?: string
  onClose: () => void
  onSignOut: () => void
  onToggle: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-controls="account-menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open account menu"
        className="flex min-h-touch w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold text-text transition-colors duration-fast hover:bg-background lg:min-h-0 lg:py-1"
        type="button"
        onClick={onToggle}
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
        <span className="min-w-0 truncate">{displayName}</span>
      </button>

      {isOpen ? (
        <div
          aria-label="Account actions"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-50 grid gap-1 rounded-lg border border-border bg-background p-2 shadow-floating"
          id="account-menu"
        >
          <NavLink
            className="flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-text transition-colors duration-fast hover:bg-surface-subtle lg:min-h-0 lg:py-1"
            to="/profile"
            onClick={onClose}
          >
            <span className="flex size-9 shrink-0 items-center justify-center">
              <ProfileIcon className="size-5 text-text-muted" />
            </span>
            <span>Profile</span>
          </NavLink>
          <SettingsNavigationLink onClick={onClose} />
          <SignOutControl
            error={signOutError}
            isPending={isPending}
            onSignOut={onSignOut}
          />
        </div>
      ) : null}
    </div>
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
                    <>
                      <ProfileAvatar
                        className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-full text-xs"
                        displayName={conversation.otherDisplayName}
                        fallbackClassName={
                          isActive
                            ? 'bg-background/20 text-on-primary'
                            : 'bg-background text-primary-strong'
                        }
                        userId={conversation.otherUserId}
                      />
                      <ConversationSummary
                        activity={conversation}
                        currentUserId={currentUserId}
                        isSelected={isActive}
                        title={conversation.otherDisplayName}
                      />
                    </>
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string>()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuthSession()
  const flocksQuery = useFlockChats()
  const directConversationsQuery = useDirectConversations()
  const notificationsQuery = useNotifications()
  const profileQuery = useProfile()
  useConversationDirectorySync(session?.user.id)
  usePushSubscriptionRefresh()
  const isChatRoute = location.pathname.startsWith('/chats')
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const displayName =
    profileQuery.data?.displayName ??
    session?.user.user_metadata?.display_name ??
    session?.user.user_metadata?.full_name ??
    'Your profile'
  const initial = displayName.trim().charAt(0).toLocaleUpperCase() || 'P'
  const profileAvatar = profileQuery.data?.avatarUrl ?? null
  const unreadNotificationCount =
    notificationsQuery.data?.filter((notification) => !notification.isRead)
      .length ?? 0

  useEffect(() => {
    if (!isMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsAccountMenuOpen(false)
  }

  async function handleSignOut() {
    setSignOutError(undefined)
    setIsSigningOut(true)
    try {
      const { error } = await signOut()
      if (error) throw error
      queryClient.clear()
      closeMenu()
      navigate('/sign-in', { replace: true })
    } catch {
      setSignOutError(
        'We could not sign you out. Check your connection and try again.',
      )
    } finally {
      setIsSigningOut(false)
    }
  }

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
          <div className="flex items-center gap-1">
            <NavLink
              aria-label={
                unreadNotificationCount > 0
                  ? `Notifications, ${unreadNotificationCount} unread`
                  : 'Notifications'
              }
              className="relative flex size-11 items-center justify-center rounded-md text-text hover:bg-surface-subtle"
              to="/notifications"
            >
              <BellIcon className="size-5" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 text-on-danger">
                  {unreadNotificationCount > 99
                    ? '99+'
                    : unreadNotificationCount}
                </span>
              ) : null}
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
              <div className="grid gap-1">
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
              <div className="mt-4 grid gap-1 border-t border-border pt-4">
                <AccountMenu
                  displayName={displayName}
                  initial={initial}
                  isOpen={isAccountMenuOpen}
                  isPending={isSigningOut}
                  profileAvatar={profileAvatar}
                  signOutError={signOutError}
                  onClose={closeMenu}
                  onSignOut={() => void handleSignOut()}
                  onToggle={() => setIsAccountMenuOpen((open) => !open)}
                />
              </div>
            </nav>
          </>
        ) : null}
      </header>

      <aside className="sticky top-0 hidden h-dvh max-h-dvh w-60 shrink-0 self-start overflow-y-auto border-r border-border bg-surface-subtle lg:flex lg:flex-col lg:p-5">
        <div className="flex items-center justify-between gap-2">
          <NavLink
            aria-label="Flock home"
            className="flex min-w-0 items-center gap-3 font-display text-xl font-bold text-text"
            to="/flocks"
          >
            <img
              alt=""
              className="size-10 shrink-0 rounded-lg"
              src="/icons/flock-mark.svg"
            />
            <span>Flock</span>
          </NavLink>
          <NavLink
            aria-label={
              unreadNotificationCount > 0
                ? `Notifications, ${unreadNotificationCount} unread`
                : 'Notifications'
            }
            className="relative flex size-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-background hover:text-text"
            title="Notifications"
            to="/notifications"
          >
            <BellIcon className="size-5" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 text-on-danger">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            ) : null}
          </NavLink>
        </div>
        <nav aria-label="Main navigation" className="mt-10 grid gap-1">
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
        <div className="mt-auto grid gap-1 border-t border-border pt-4">
          <AccountMenu
            displayName={displayName}
            initial={initial}
            isOpen={isAccountMenuOpen}
            isPending={isSigningOut}
            profileAvatar={profileAvatar}
            signOutError={signOutError}
            onClose={closeMenu}
            onSignOut={() => void handleSignOut()}
            onToggle={() => setIsAccountMenuOpen((open) => !open)}
          />
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
