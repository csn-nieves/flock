import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'

import { useAuthSession } from '@src/hooks/useAuthSession'

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

function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { session } = useAuthSession()
  const displayName =
    session?.user.user_metadata?.display_name ??
    session?.user.user_metadata?.full_name ??
    'Your profile'
  const firstName = displayName.trim().split(/\s+/)[0] || 'Profile'
  const initial = firstName.charAt(0).toLocaleUpperCase() || 'P'

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
    <div className="flex min-h-dvh flex-col lg:flex-row">
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
              </div>
              <div className="mt-4 grid gap-2 border-t border-border pt-4">
                <div onClick={closeMenu}>
                  <NavLink
                    aria-label={`Open ${displayName} profile`}
                    className="flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-text hover:bg-surface-subtle"
                    to="/profile"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-on-primary"
                    >
                      {initial}
                    </span>
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

      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface-subtle lg:flex lg:flex-col lg:p-5">
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
        </nav>
        <div className="mt-auto grid gap-2 border-t border-border pt-4">
          <NavLink
            aria-label={`Open ${displayName} profile`}
            className="flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-text hover:bg-background"
            to="/profile"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-on-primary"
            >
              {initial}
            </span>
            <span className="min-w-0 truncate">{firstName}</span>
          </NavLink>
          <NavigationLink label="Settings" to="/settings" />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-8 lg:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppShell
