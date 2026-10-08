import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FlockSummary } from '@src/types/flocks'
import type { FlockMemberSummary } from '@src/types/flockMembers'
import type { FlockEvent } from '@src/types/events'
import FlockDetailRoute from './FlockDetailRoute'

const flockQuery = vi.hoisted(() => ({
  data: undefined as FlockSummary | null | undefined,
  error: null as Error | null,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const useFlockMock = vi.hoisted(() => vi.fn(() => flockQuery))
const membersQuery = vi.hoisted(() => ({
  data: undefined as FlockMemberSummary[] | undefined,
  error: null as Error | null,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const useFlockMembersMock = vi.hoisted(() => vi.fn(() => membersQuery))
const eventsQuery = vi.hoisted(() => ({
  data: [] as FlockEvent[],
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const useFlockEventsMock = vi.hoisted(() => vi.fn(() => eventsQuery))
const createEventMock = vi.hoisted(() =>
  vi.fn(() => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
)
const authSession = vi.hoisted(() => ({
  session: { user: { id: 'owner-id' } },
}))
const responseMutationMock = vi.hoisted(() =>
  vi.fn(() => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
)
const updateEventMock = vi.hoisted(() =>
  vi.fn(() => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
)
const updateFlockMutation = vi.hoisted(() => ({
  isError: false,
  isPending: false,
  mutate: vi.fn(),
  reset: vi.fn(),
}))
const cancelEventMock = vi.hoisted(() =>
  vi.fn(() => ({ isError: false, isPending: false, mutateAsync: vi.fn() })),
)
const invitationMutationMock = vi.hoisted(() =>
  vi.fn(() => ({
    data: undefined,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  })),
)
const savedRouteLibraryMock = vi.hoisted(() =>
  vi.fn(() => ({
    isDeleting: false,
    isLoading: false,
    isRenaming: false,
    isSaving: false,
    routes: [],
    status: 'ready' as const,
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onRetry: vi.fn(),
    onSave: vi.fn(),
  })),
)

vi.mock('@src/hooks/useFlock', () => ({
  useFlock: useFlockMock,
}))

vi.mock('@src/hooks/useFlockMembers', () => ({
  useFlockMembers: useFlockMembersMock,
}))

vi.mock('@src/hooks/useFlockEvents', () => ({
  useFlockEvents: useFlockEventsMock,
}))

vi.mock('@src/hooks/useCreateFlockEvent', () => ({
  useCreateFlockEvent: createEventMock,
}))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => authSession,
}))

vi.mock('@src/hooks/useSetFlockEventResponse', () => ({
  useSetFlockEventResponse: responseMutationMock,
}))

vi.mock('@src/hooks/useUpdateFlockEvent', () => ({
  useUpdateFlockEvent: updateEventMock,
}))

vi.mock('@src/hooks/useUpdateFlock', () => ({
  useUpdateFlock: () => updateFlockMutation,
}))

vi.mock('@src/hooks/useCancelFlockEvent', () => ({
  useCancelFlockEvent: cancelEventMock,
}))

vi.mock('@src/hooks/useCreateFlockInvitation', () => ({
  useCreateFlockInvitation: invitationMutationMock,
}))

vi.mock('@src/hooks/useSavedRouteLibrary', () => ({
  useSavedRouteLibrary: savedRouteLibraryMock,
}))

const flock: FlockSummary = {
  description: 'Friendly morning miles for every pace.',
  id: 'morning-runners-id',
  location: 'Eastbank Esplanade, Portland',
  name: 'Morning Runners',
  owner_id: 'owner-id',
}

const members: FlockMemberSummary[] = [
  {
    displayName: 'Local Organizer',
    location: 'Portland, Oregon',
    joinedAt: '2026-01-01T12:00:00.000Z',
    role: 'owner',
    userId: 'owner-id',
  },
  {
    displayName: 'Local Runner',
    location: null,
    joinedAt: '2026-01-02T12:00:00.000Z',
    role: 'member',
    userId: 'runner-id',
  },
]

function renderFlockDetailRoute(path = `/flocks/${flock.id}`) {
  const router = createMemoryRouter(
    [
      {
        path: '/flocks',
        element: <p>Flock collection destination</p>,
      },
      {
        path: '/missing-flock-id',
        element: <FlockDetailRoute />,
      },
      {
        path: '/flocks/:flockId',
        element: <FlockDetailRoute />,
      },
      {
        path: '/flocks/:flockId/invitations/new',
        element: <p>Create invitation destination</p>,
      },
    ],
    { initialEntries: [path] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('FlockDetailRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flockQuery.data = flock
    flockQuery.error = null
    flockQuery.isError = false
    flockQuery.isFetching = false
    flockQuery.isPending = false
    membersQuery.data = members
    membersQuery.error = null
    membersQuery.isError = false
    membersQuery.isFetching = false
    membersQuery.isPending = false
  })

  it('loads the flock identified by the route and renders its pure page', () => {
    renderFlockDetailRoute()

    expect(useFlockMock).toHaveBeenCalledWith(flock.id)
    expect(useFlockMembersMock).toHaveBeenCalledWith(flock.id)
    expect(document.title).toBe('Morning Runners — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Morning Runners' }),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByRole('list', { name: 'Flock members' })).toBeVisible()
    expect(screen.getByText('Local Organizer')).toBeVisible()
    expect(screen.getByText('Local Runner')).toBeVisible()
  })

  it('opens invitation creation for the visible flock', async () => {
    const router = renderFlockDetailRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Invite a runner' }))

    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Create invitation link' }),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks/morning-runners-id')
  })

  it('lets the flock owner edit profile details and confirms success', async () => {
    renderFlockDetailRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Edit flock details' }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Edit flock details',
    })
    const locationInput = screen.getByRole('textbox', { name: 'Location' })
    expect(locationInput).toHaveValue('Eastbank Esplanade, Portland')
    fireEvent.change(locationInput, {
      target: { value: 'Mount Tabor, Portland' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(updateFlockMutation.mutate).toHaveBeenCalledWith(
      {
        description: 'Friendly morning miles for every pace.',
        flockId: flock.id,
        location: 'Mount Tabor, Portland',
        name: flock.name,
      },
      { onSuccess: expect.any(Function) },
    )

    const mutationOptions = updateFlockMutation.mutate.mock.calls[0]?.[1]
    act(() => mutationOptions.onSuccess())

    expect(dialog).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Flock details saved.')
  })

  it('shows an honest initial loading state', () => {
    flockQuery.data = undefined
    flockQuery.isFetching = true
    flockQuery.isPending = true
    renderFlockDetailRoute()

    expect(document.title).toBe('Loading flock… — Flock')
    expect(screen.getByRole('status')).toHaveTextContent('Loading flock…')
  })

  it('does not distinguish a missing flock from one hidden by RLS', () => {
    flockQuery.data = null
    renderFlockDetailRoute('/flocks/hidden-flock-id')

    expect(document.title).toBe('Flock not found — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Flock not found' }),
    ).toBeVisible()
    expect(screen.getByText(/may not have access/)).toBeVisible()
  })

  it('treats a missing route identifier as not found without querying', () => {
    renderFlockDetailRoute('/missing-flock-id')

    expect(useFlockMock).toHaveBeenCalledWith(undefined)
    expect(document.title).toBe('Flock not found — Flock')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Flock not found' }),
    ).toBeVisible()
  })

  it('presents safe recovery and retries without exposing internals', () => {
    flockQuery.data = undefined
    flockQuery.error = new Error('raw database failure')
    flockQuery.isError = true
    renderFlockDetailRoute()

    expect(document.title).toBe('Flock unavailable — Flock')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not load this flock. Check your connection and try again.',
    )
    expect(screen.queryByText('raw database failure')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(flockQuery.refetch).toHaveBeenCalledOnce()
  })

  it('keeps visible data during a background refresh', () => {
    flockQuery.isFetching = true
    renderFlockDetailRoute()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Morning Runners' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing flock…')
  })

  it('blocks duplicate retry activation while retrying', () => {
    flockQuery.data = undefined
    flockQuery.error = new Error('raw database failure')
    flockQuery.isError = true
    flockQuery.isFetching = true
    renderFlockDetailRoute()

    const retryButton = screen.getByRole('button', { name: 'Trying again' })
    expect(retryButton).toBeDisabled()
    expect(retryButton).toHaveAttribute('aria-busy', 'true')

    fireEvent.click(retryButton)
    expect(flockQuery.refetch).not.toHaveBeenCalled()
  })

  it('keeps the flock visible while its members load', () => {
    membersQuery.data = undefined
    membersQuery.isFetching = true
    membersQuery.isPending = true
    renderFlockDetailRoute()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Morning Runners' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Loading members…')
  })

  it('scopes member failures to the member section and retries safely', () => {
    membersQuery.data = undefined
    membersQuery.error = new Error('raw member database failure')
    membersQuery.isError = true
    renderFlockDetailRoute()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Morning Runners' }),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not load the member list. Check your connection and try again.',
    )
    expect(
      screen.queryByText('raw member database failure'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(membersQuery.refetch).toHaveBeenCalledOnce()
  })

  it('keeps stale members visible when a background refresh fails', () => {
    membersQuery.error = new Error('raw member database failure')
    membersQuery.isError = true
    renderFlockDetailRoute()

    expect(screen.getByText('Local Runner')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The member list may be out of date.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }))
    expect(membersQuery.refetch).toHaveBeenCalledOnce()
  })
})
