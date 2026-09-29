import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthSessionProvider } from './AuthSessionProvider'
import { useAuthSession } from './useAuthSession'

const authMocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
}))

vi.mock('@src/data/auth', () => authMocks)

function SessionStatus() {
  const { error, isLoading, session } = useAuthSession()

  if (isLoading) {
    return <p>Loading session</p>
  }

  if (error) {
    return <p>{error.message}</p>
  }

  return <p>{session?.user.email ?? 'Signed out'}</p>
}

describe('AuthSessionProvider', () => {
  it('resolves the initial persisted session', async () => {
    const session = {
      user: {
        email: 'runner@example.com',
      },
    } as Session
    authMocks.getCurrentSession.mockResolvedValue({
      data: { session },
      error: null,
    })
    authMocks.subscribeToAuthChanges.mockReturnValue(vi.fn())

    render(
      <AuthSessionProvider>
        <SessionStatus />
      </AuthSessionProvider>,
    )

    expect(screen.getByText('Loading session')).toBeInTheDocument()
    expect(await screen.findByText('runner@example.com')).toBeInTheDocument()
  })

  it('updates the session when authentication changes', async () => {
    let authChangeListener:
      ((event: AuthChangeEvent, session: Session | null) => void) | undefined
    authMocks.getCurrentSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    authMocks.subscribeToAuthChanges.mockImplementation((listener) => {
      authChangeListener = listener
      return vi.fn()
    })

    render(
      <AuthSessionProvider>
        <SessionStatus />
      </AuthSessionProvider>,
    )

    expect(await screen.findByText('Signed out')).toBeInTheDocument()

    const session = {
      user: {
        email: 'runner@example.com',
      },
    } as Session

    act(() => {
      authChangeListener?.('SIGNED_IN', session)
    })

    expect(screen.getByText('runner@example.com')).toBeInTheDocument()
  })

  it('unsubscribes when the provider unmounts', async () => {
    const unsubscribe = vi.fn()
    authMocks.getCurrentSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    authMocks.subscribeToAuthChanges.mockReturnValue(unsubscribe)

    const { unmount } = render(
      <AuthSessionProvider>
        <SessionStatus />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Signed out')).toBeInTheDocument()
    })

    unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('requires the hook to be used within the provider', () => {
    expect(() => render(<SessionStatus />)).toThrow(
      'useAuthSession must be used within AuthSessionProvider.',
    )
  })
})
