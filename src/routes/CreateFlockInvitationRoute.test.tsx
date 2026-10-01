import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import type { FlockInvitation } from '@src/types/invitations'
import CreateFlockInvitationRoute from './CreateFlockInvitationRoute'

const flockQuery = vi.hoisted(() => ({
  data: undefined as FlockSummary | null | undefined,
  error: null as Error | null,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const invitationMutation = vi.hoisted(() => ({
  data: undefined as FlockInvitation | undefined,
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutate: vi.fn(),
}))
const useFlockMock = vi.hoisted(() => vi.fn(() => flockQuery))

vi.mock('@src/hooks/useFlock', () => ({
  useFlock: useFlockMock,
}))

vi.mock('@src/hooks/useCreateFlockInvitation', () => ({
  useCreateFlockInvitation: () => invitationMutation,
}))

const flock: FlockSummary = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

function renderCreateFlockInvitationRoute(
  path = `/flocks/${flock.id}/invitations/new`,
) {
  const router = createMemoryRouter(
    [
      {
        path: '/flocks/:flockId/invitations/new',
        element: <CreateFlockInvitationRoute />,
      },
    ],
    { initialEntries: [path] },
  )

  return render(<RouterProvider router={router} />)
}

describe('CreateFlockInvitationRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flockQuery.data = flock
    flockQuery.error = null
    flockQuery.isError = false
    flockQuery.isFetching = false
    flockQuery.isPending = false
    invitationMutation.data = undefined
    invitationMutation.error = null
    invitationMutation.isError = false
    invitationMutation.isPending = false
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
  })

  it('loads the flock and creates an invitation for it', () => {
    renderCreateFlockInvitationRoute()

    expect(useFlockMock).toHaveBeenCalledWith(flock.id)
    expect(document.title).toBe('Invite to Morning Runners — Flock')

    fireEvent.click(
      screen.getByRole('button', { name: 'Create invitation link' }),
    )

    expect(invitationMutation.mutate).toHaveBeenCalledWith(flock.id)
  })

  it('maps pending creation to stable duplicate-safe progress', () => {
    invitationMutation.isPending = true
    renderCreateFlockInvitationRoute()

    const button = screen.getByRole('button', {
      name: 'Creating invitation',
    })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    fireEvent.click(button)
    expect(invitationMutation.mutate).not.toHaveBeenCalled()
  })

  it('shows a safe creation error without exposing transport details', () => {
    invitationMutation.error = new Error('raw database failure')
    invitationMutation.isError = true
    renderCreateFlockInvitationRoute()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not create an invitation. Check your connection and try again.',
    )
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create invitation link' }),
    ).toBeEnabled()
  })

  it('builds an application invitation URL and copies it on request', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    invitationMutation.data = {
      expiresAt: '2026-10-02T12:00:00.000Z',
      token: 'invitation-token',
    }
    renderCreateFlockInvitationRoute()

    fireEvent.click(
      screen.getByRole('button', { name: 'Copy invitation link' }),
    )

    expect(writeText).toHaveBeenCalledWith(
      'http://localhost:3000/invitations/invitation-token',
    )
    expect(await screen.findByText('Invitation link copied.')).toBeVisible()
  })

  it('uses native sharing when the browser supports it', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    })
    invitationMutation.data = {
      expiresAt: '2026-10-02T12:00:00.000Z',
      token: 'invitation-token',
    }
    renderCreateFlockInvitationRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Share invitation' }))

    expect(share).toHaveBeenCalledWith({
      text: 'Join Morning Runners on Flock.',
      title: 'Join Morning Runners on Flock',
      url: 'http://localhost:3000/invitations/invitation-token',
    })
    expect(await screen.findByText('Invitation shared.')).toBeVisible()
  })

  it('does not report closing the native share sheet as an error', async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException('Share cancelled.', 'AbortError'))
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    })
    invitationMutation.data = {
      expiresAt: '2026-10-02T12:00:00.000Z',
      token: 'invitation-token',
    }
    renderCreateFlockInvitationRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Share invitation' }))

    expect(
      await screen.findByText(
        'This link works once and expires 24 hours after creation.',
      ),
    ).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('provides an encoded email fallback for the invitation', () => {
    invitationMutation.data = {
      expiresAt: '2026-10-02T12:00:00.000Z',
      token: 'invitation-token',
    }
    renderCreateFlockInvitationRoute()

    expect(
      screen.getByRole('link', { name: 'Email invitation' }),
    ).toHaveAttribute(
      'href',
      'mailto:?subject=Join%20Morning%20Runners%20on%20Flock&body=Join%20Morning%20Runners%20on%20Flock%3A%0A%0Ahttp%3A%2F%2Flocalhost%3A3000%2Finvitations%2Finvitation-token',
    )
  })

  it('shows loading, missing, and recoverable query states', () => {
    flockQuery.data = undefined
    flockQuery.isFetching = true
    flockQuery.isPending = true
    const { unmount } = renderCreateFlockInvitationRoute()

    expect(document.title).toBe('Loading flock… — Flock')
    expect(screen.getByRole('status')).toHaveTextContent('Loading flock…')
    unmount()

    flockQuery.isPending = false
    flockQuery.isFetching = false
    flockQuery.data = null
    renderCreateFlockInvitationRoute()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Flock not found' }),
    ).toBeVisible()
  })

  it('retries a failed flock query without exposing its error', () => {
    flockQuery.data = undefined
    flockQuery.error = new Error('raw query failure')
    flockQuery.isError = true
    renderCreateFlockInvitationRoute()

    expect(document.title).toBe('Flock unavailable — Flock')
    expect(screen.queryByText('raw query failure')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(flockQuery.refetch).toHaveBeenCalledOnce()
  })
})
