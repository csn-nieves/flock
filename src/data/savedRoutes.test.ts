import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSavedRoute,
  deleteSavedRoute,
  listSavedRoutes,
  renameSavedRoute,
} from './savedRoutes'

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))
vi.mock('./supabase', () => ({ supabase: mocks }))

const row = {
  created_at: '2026-10-07T12:00:00Z',
  id: 'route-id',
  name: 'Riverside Loop',
  route_coordinates: [
    [-74.01, 40.7],
    [-74, 40.71],
  ],
  route_distance_meters: 1609,
  updated_at: '2026-10-07T12:00:00Z',
}

describe('saved route data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists saved routes in recently updated order', async () => {
    const query = { order: vi.fn(), select: vi.fn() }
    query.select.mockReturnValue(query)
    query.order.mockResolvedValue({ data: [row], error: null })
    mocks.from.mockReturnValue(query)

    await expect(listSavedRoutes()).resolves.toEqual([
      {
        createdAt: row.created_at,
        id: 'route-id',
        name: 'Riverside Loop',
        route: {
          coordinates: row.route_coordinates,
          distanceMeters: 1609,
        },
        updatedAt: row.updated_at,
      },
    ])
    expect(query.order).toHaveBeenCalledWith('updated_at', {
      ascending: false,
    })
  })

  it('creates a saved route without a client-supplied owner', async () => {
    mocks.rpc.mockResolvedValue({ data: row, error: null })

    await createSavedRoute({
      name: 'Riverside Loop',
      route: {
        coordinates: row.route_coordinates as [number, number][],
        distanceMeters: 1609,
      },
    })

    expect(mocks.rpc).toHaveBeenCalledWith('create_saved_route', {
      route_coordinates: row.route_coordinates,
      route_distance_meters: 1609,
      route_name: 'Riverside Loop',
    })
  })

  it('renames and deletes through owner-scoped functions', async () => {
    mocks.rpc
      .mockResolvedValueOnce({
        data: { ...row, name: 'Morning Loop' },
        error: null,
      })
      .mockResolvedValueOnce({ data: 'route-id', error: null })

    await renameSavedRoute({ name: 'Morning Loop', routeId: 'route-id' })
    await deleteSavedRoute('route-id')

    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'rename_saved_route', {
      route_name: 'Morning Loop',
      target_route_id: 'route-id',
    })
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'delete_saved_route', {
      target_route_id: 'route-id',
    })
  })
})
