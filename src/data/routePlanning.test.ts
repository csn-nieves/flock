import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  findRouteCenter,
  isRoutePlanningConfigured,
  planWalkingSegment,
  RoutePlanningError,
} from './routePlanning'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('route planning', () => {
  it('reports whether a public browser key is configured', () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', '')
    expect(isRoutePlanningConfigured()).toBe(false)
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', 'public-key')
    expect(isRoutePlanningConfigured()).toBe(true)
  })

  it('requests a walking route and normalizes GeoJSON coordinates', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', 'public-key')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          features: [
            {
              geometry: {
                coordinates: [
                  [
                    [-74.01, 40.7],
                    [-74, 40.71],
                  ],
                ],
                type: 'MultiLineString',
              },
              properties: { distance: 1532.4 },
            },
          ],
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      planWalkingSegment([-74.01, 40.7], [-74, 40.71]),
    ).resolves.toEqual({
      coordinates: [
        [-74.01, 40.7],
        [-74, 40.71],
      ],
      distanceMeters: 1532,
    })
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('waypoints')).toBe('40.7,-74.01|40.71,-74')
    expect(url.searchParams.get('mode')).toBe('walk')
    expect(url.searchParams.get('type')).toBe('short')
  })

  it('turns an unavailable route into actionable copy', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', 'public-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response('{}'))),
    )
    await expect(
      planWalkingSegment([-74.01, 40.7], [-74, 40.71]),
    ).rejects.toThrow(RoutePlanningError)
    await expect(
      planWalkingSegment([-74.01, 40.7], [-74, 40.71]),
    ).rejects.toThrow('No walkable route was found')
  })

  it('finds a best-effort starting center from the event location', async () => {
    vi.stubEnv('VITE_GEOAPIFY_API_KEY', 'public-key')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ results: [{ lat: 40.7, lon: -74.01 }] })),
      )
    vi.stubGlobal('fetch', fetchMock)
    await expect(findRouteCenter('Riverside Park')).resolves.toEqual([
      -74.01, 40.7,
    ])
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('text')).toBe('Riverside Park')
  })
})
