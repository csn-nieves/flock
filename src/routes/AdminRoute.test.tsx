import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AdminEventPage,
  AdminFlock,
  AdminMembershipPage,
  AdminUser,
} from '@src/data/admin'
import AdminRoute from './AdminRoute'

const auth = vi.hoisted(() => ({
  session: {
    user: { app_metadata: { role: 'superadmin' } },
  } as { user: { app_metadata: { role?: string } } } | null,
}))
const eventsQuery = vi.hoisted(() => ({
  data: {
    events: [
      {
        canceledAt: null,
        createdBy: 'owner-id',
        flockName: null,
        id: 'event-id',
        location: 'Riverside Park',
        startsAt: '2099-10-10T12:00:00Z',
        title: 'Saturday social run',
      },
    ],
    totalCount: 42,
  } as AdminEventPage | undefined,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const flocksQuery = vi.hoisted(() => ({
  data: [] as AdminFlock[] | undefined,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const membershipsQuery = vi.hoisted(() => ({
  data: {
    memberships: [
      {
        flockId: 'flock-id',
        flockName: 'Morning Miles',
        joinedAt: '2026-10-01T12:00:00Z',
        role: 'member',
        userId: 'runner-id',
      },
    ],
    totalCount: 42,
  } as AdminMembershipPage | undefined,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const usersQuery = vi.hoisted(() => ({
  data: [] as AdminUser[] | undefined,
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: vi.fn(),
}))
const cancelMutation = vi.hoisted(() => ({
  isError: false,
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
}))
const deleteMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn(),
}))
const removeMembershipMutation = vi.hoisted(() => ({
  isError: false,
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
}))
const useAdminEvents = vi.hoisted(() => vi.fn(() => eventsQuery))
const useAdminMemberships = vi.hoisted(() => vi.fn(() => membershipsQuery))

vi.mock('@src/hooks/useAuthSession', () => ({
  useAuthSession: () => auth,
}))
vi.mock('@src/hooks/useAdminDashboard', () => ({
  useAdminEvents,
  useAdminFlocks: () => flocksQuery,
  useAdminMemberships,
  useAdminUsers: () => usersQuery,
}))
vi.mock('@src/hooks/useCancelAdminEvent', () => ({
  useCancelAdminEvent: () => cancelMutation,
}))
vi.mock('@src/hooks/useDeleteAdminFlock', () => ({
  useDeleteAdminFlock: () => deleteMutation,
}))
vi.mock('@src/hooks/useRemoveAdminMembership', () => ({
  useRemoveAdminMembership: () => removeMembershipMutation,
}))

function renderAdminRoute(initialEntry = '/admin') {
  const router = createMemoryRouter(
    [
      { path: '/admin', element: <AdminRoute /> },
      { path: '/flocks', element: <p>Flocks destination</p> },
    ],
    { initialEntries: [initialEntry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.session = { user: { app_metadata: { role: 'superadmin' } } }
    eventsQuery.data = {
      events: [
        {
          canceledAt: null,
          createdBy: 'owner-id',
          flockName: null,
          id: 'event-id',
          location: 'Riverside Park',
          startsAt: '2099-10-10T12:00:00Z',
          title: 'Saturday social run',
        },
      ],
      totalCount: 42,
    }
    eventsQuery.isError = false
    eventsQuery.isFetching = false
    eventsQuery.isPending = false
    flocksQuery.data = []
    flocksQuery.isError = false
    flocksQuery.isFetching = false
    flocksQuery.isPending = false
    membershipsQuery.data = {
      memberships: [
        {
          flockId: 'flock-id',
          flockName: 'Morning Miles',
          joinedAt: '2026-10-01T12:00:00Z',
          role: 'member',
          userId: 'runner-id',
        },
      ],
      totalCount: 42,
    }
    membershipsQuery.isError = false
    membershipsQuery.isFetching = false
    membershipsQuery.isPending = false
    usersQuery.data = []
    usersQuery.isError = false
    usersQuery.isFetching = false
    usersQuery.isPending = false
  })

  it('keeps event pagination in the URL', () => {
    const router = renderAdminRoute()
    const eventNavigation = screen.getByRole('navigation', {
      name: 'Event pages',
    })

    expect(document.title).toBe('Admin — Flock')
    fireEvent.click(
      within(eventNavigation).getByRole('button', { name: 'Next' }),
    )
    expect(router.state.location.search).toBe('?page=2')
    expect(useAdminEvents).toHaveBeenLastCalledWith(2)
  })

  it('replaces malformed and out-of-range event pages with safe values', async () => {
    const malformedRouter = renderAdminRoute('/admin?page=not-a-page')

    await vi.waitFor(() =>
      expect(malformedRouter.state.location.search).toBe(''),
    )
    expect(useAdminEvents).toHaveBeenCalledWith(1)

    const outOfRangeRouter = renderAdminRoute('/admin?page=99')

    await vi.waitFor(() =>
      expect(outOfRangeRouter.state.location.search).toBe('?page=3'),
    )
  })

  it('keeps membership pagination independent in the URL', () => {
    const router = renderAdminRoute('/admin?page=2')
    const membershipNavigation = screen.getByRole('navigation', {
      name: 'Membership pages',
    })

    fireEvent.click(
      within(membershipNavigation).getByRole('button', { name: 'Next' }),
    )
    expect(router.state.location.search).toBe('?page=2&membersPage=2')
    expect(useAdminMemberships).toHaveBeenLastCalledWith(2)
  })

  it('clamps an out-of-range membership page', async () => {
    const router = renderAdminRoute('/admin?membersPage=99')

    await vi.waitFor(() =>
      expect(router.state.location.search).toBe('?membersPage=3'),
    )
  })

  it('shows honest loading and retry states', () => {
    eventsQuery.data = undefined
    eventsQuery.isFetching = true
    eventsQuery.isPending = true
    const { unmount } = render(
      <RouterProvider
        router={createMemoryRouter(
          [{ path: '/admin', element: <AdminRoute /> }],
          { initialEntries: ['/admin'] },
        )}
      />,
    )

    expect(document.title).toBe('Loading admin… — Flock')
    expect(screen.getByRole('status')).toHaveTextContent('Loading admin data…')
    unmount()

    eventsQuery.isPending = false
    eventsQuery.isFetching = false
    eventsQuery.isError = true
    renderAdminRoute()
    expect(document.title).toBe('Admin unavailable — Flock')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(eventsQuery.refetch).toHaveBeenCalledOnce()
    expect(flocksQuery.refetch).toHaveBeenCalledOnce()
    expect(membershipsQuery.refetch).toHaveBeenCalledOnce()
    expect(usersQuery.refetch).toHaveBeenCalledOnce()
  })

  it('redirects a non-superadmin to the allowed flock list', async () => {
    auth.session = { user: { app_metadata: {} } }
    const router = renderAdminRoute()

    expect(await screen.findByText('Flocks destination')).toBeVisible()
    expect(router.state.location.pathname).toBe('/flocks')
  })
})
