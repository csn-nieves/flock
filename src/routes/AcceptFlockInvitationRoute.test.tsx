import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvitationUnavailableError } from '@src/data/invitations'
import type { FlockSummary } from '@src/types/flocks'
import AcceptFlockInvitationRoute from './AcceptFlockInvitationRoute'

const invitationMutation = vi.hoisted(() => ({
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutate: vi.fn(),
}))

vi.mock('@src/hooks/useAcceptFlockInvitation', () => ({
  useAcceptFlockInvitation: () => invitationMutation,
}))

const flock: FlockSummary = {
  id: 'morning-runners-id',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

function renderAcceptFlockInvitationRoute(
  path = '/invitations/invitation-token',
) {
  const router = createMemoryRouter(
    [
      {
        path: '/flocks',
        element: <p>Flock collection destination</p>,
      },
      {
        path: '/flocks/:flockId',
        element: <p>Joined flock destination</p>,
      },
      {
        path: '/invitations/:invitationToken?',
        element: <AcceptFlockInvitationRoute />,
      },
    ],
    { initialEntries: [path] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('AcceptFlockInvitationRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invitationMutation.error = null
    invitationMutation.isError = false
    invitationMutation.isPending = true
  })

  it('automatically accepts the route token with stable progress', async () => {
    renderAcceptFlockInvitationRoute()

    expect(document.title).toBe('Joining flock… — Flock')
    expect(screen.getByRole('status')).toHaveTextContent('Joining flock…')
    await waitFor(() =>
      expect(invitationMutation.mutate).toHaveBeenCalledWith(
        'invitation-token',
        { onSuccess: expect.any(Function) },
      ),
    )
  })

  it('replaces the invitation route with the joined flock', async () => {
    const router = renderAcceptFlockInvitationRoute()
    await waitFor(() => expect(invitationMutation.mutate).toHaveBeenCalled())

    const mutationOptions = invitationMutation.mutate.mock.calls[0]?.[1]
    mutationOptions.onSuccess(flock)

    expect(await screen.findByText('Joined flock destination')).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks/morning-runners-id')

    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/flocks/morning-runners-id')
  })

  it('shows one unavailable state for invalid, expired, or used links', () => {
    invitationMutation.error = new InvitationUnavailableError()
    invitationMutation.isError = true
    invitationMutation.isPending = false
    renderAcceptFlockInvitationRoute()

    expect(document.title).toBe('Invitation unavailable — Flock')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Invitation unavailable',
      }),
    ).toBeVisible()
    expect(screen.getByText(/expired, has already been used/)).toBeVisible()
  })

  it('retries a connection failure without exposing transport details', async () => {
    invitationMutation.error = new Error('raw database failure')
    invitationMutation.isError = true
    invitationMutation.isPending = false
    renderAcceptFlockInvitationRoute()

    expect(document.title).toBe('Could not join flock — Flock')
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(invitationMutation.mutate).toHaveBeenCalledOnce(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(invitationMutation.mutate).toHaveBeenCalledTimes(2)
  })

  it('treats a missing token as unavailable without mutating', () => {
    invitationMutation.isPending = false
    renderAcceptFlockInvitationRoute('/invitations')

    expect(document.title).toBe('Invitation unavailable — Flock')
    expect(invitationMutation.mutate).not.toHaveBeenCalled()
  })
})
