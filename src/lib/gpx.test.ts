import { describe, expect, it } from 'vitest'

import { GpxParseError, MAX_ROUTE_COORDINATES, parseGpxText } from './gpx'

describe('GPX parsing', () => {
  it('keeps only longitude and latitude from the longest track segment', () => {
    const route = parseGpxText(`
      <gpx version="1.1">
        <trk><trkseg>
          <trkpt lat="40.7000" lon="-74.0100"><ele>12</ele><time>2026-10-07T12:00:00Z</time></trkpt>
          <trkpt lat="40.7010" lon="-74.0090"><ele>14</ele></trkpt>
          <trkpt lat="40.7020" lon="-74.0080" />
        </trkseg></trk>
      </gpx>
    `)

    expect(route.coordinates).toEqual([
      [-74.01, 40.7],
      [-74.009, 40.701],
      [-74.008, 40.702],
    ])
    expect(route.distanceMeters).toBeGreaterThan(200)
    expect(JSON.stringify(route)).not.toContain('2026-10-07')
  })

  it('supports GPX route points', () => {
    expect(
      parseGpxText(`
        <gpx version="1.1"><rte>
          <rtept lat="35" lon="-80" />
          <rtept lat="35.01" lon="-80.01" />
        </rte></gpx>
      `).coordinates,
    ).toHaveLength(2)
  })

  it('rejects malformed and unsupported routes', () => {
    expect(() => parseGpxText('<gpx><trk>')).toThrow(GpxParseError)
    expect(() =>
      parseGpxText(
        '<gpx><rte><rtept lat="91" lon="0"/><rtept lat="0" lon="0"/></rte></gpx>',
      ),
    ).toThrow('invalid coordinate')
  })

  it('bounds the stored coordinate count', () => {
    const points = Array.from({ length: 1500 }, (_, index) => {
      const latitude = 40 + index * 0.00001
      const longitude = -74 + Math.sin(index / 20) * 0.001
      return `<trkpt lat="${latitude}" lon="${longitude}" />`
    }).join('')

    const route = parseGpxText(
      `<gpx><trk><trkseg>${points}</trkseg></trk></gpx>`,
    )

    expect(route.coordinates.length).toBeLessThanOrEqual(MAX_ROUTE_COORDINATES)
    expect(route.coordinates[0]).toEqual([-74, 40])
    expect(route.coordinates.at(-1)).toEqual([
      -74 + Math.sin(1499 / 20) * 0.001,
      40 + 1499 * 0.00001,
    ])
  })
})
