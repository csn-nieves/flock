import { describe, expect, it } from 'vitest'
import type { FlockEvent } from '@src/types/events'
import { eventToFormValues } from './eventPlanning'

const event: FlockEvent = {
  attendance: {
    groups: [{ in: 3, maybe: 1, runOptionId: 'run-option' }],
    in: 3,
    maybe: 1,
    out: 2,
    response: 'in',
    runOptionId: 'run-option',
  },
  canceledAt: null,
  createdAt: '2026-10-01T12:00:00Z',
  createdBy: 'owner',
  description: 'Easy miles together.',
  flockId: 'flock',
  id: 'event',
  location: 'Riverside Park',
  runOptions: [
    {
      distanceLabel: '5 mi',
      distanceTenths: 50,
      id: 'run-option',
      paceLabel: '8:00/mi',
      paceSeconds: 480,
      position: 0,
      route: {
        coordinates: [
          [-74.01, 40.7],
          [-74, 40.71],
        ],
        distanceMeters: 8047,
      },
      unit: 'mi',
    },
  ],
  startsAt: '2026-10-10T12:00:00Z',
  title: 'Saturday social run',
}

describe('eventToFormValues', () => {
  it('prefills planning details without lifecycle or option identities for a repeat', () => {
    const values = eventToFormValues(event, 'repeat')

    expect(values).toEqual({
      description: 'Easy miles together.',
      location: 'Riverside Park',
      runOptions: [
        {
          distanceTenths: 50,
          legacyLabel: undefined,
          paceSeconds: 480,
          route: {
            coordinates: [
              [-74.01, 40.7],
              [-74, 40.71],
            ],
            distanceMeters: 8047,
          },
          unit: 'mi',
        },
      ],
      startsAt: '',
      title: 'Saturday social run',
    })
    expect(values).not.toHaveProperty('attendance')
    expect(values.runOptions?.[0]).not.toHaveProperty('id')
    expect(values.runOptions?.[0].route).not.toBe(event.runOptions[0].route)
  })

  it('preserves the event date and option identities for editing', () => {
    expect(eventToFormValues(event, 'edit')).toEqual(
      expect.objectContaining({
        runOptions: [expect.objectContaining({ id: 'run-option' })],
        startsAt: '2026-10-10T12:00',
      }),
    )
  })
})
