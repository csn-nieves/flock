import { describe, expect, it } from 'vitest'
import { generateRecurrenceDates } from './eventRecurrence'

describe('generateRecurrenceDates', () => {
  it('generates daily occurrences using the requested interval', () => {
    expect(
      generateRecurrenceDates(
        '2026-10-22',
        { frequency: 'daily', interval: 2 },
        { kind: 'count', value: 3 },
      ),
    ).toEqual(['2026-10-22', '2026-10-24', '2026-10-26'])
  })

  it('generates selected weekdays for a weekly rule', () => {
    expect(
      generateRecurrenceDates(
        '2026-10-20',
        { frequency: 'weekly', interval: 1, weekdays: [2, 4] },
        { kind: 'count', value: 4 },
      ),
    ).toEqual(['2026-10-20', '2026-10-22', '2026-10-27', '2026-10-29'])
  })

  it('skips short months for day-of-month rules', () => {
    expect(
      generateRecurrenceDates(
        '2026-01-31',
        {
          frequency: 'monthly',
          interval: 1,
          monthlyMode: 'day-of-month',
          dayOfMonth: 31,
        },
        { kind: 'count', value: 3 },
      ),
    ).toEqual(['2026-01-31', '2026-03-31', '2026-05-31'])
  })

  it('supports weekday-position monthly rules', () => {
    expect(
      generateRecurrenceDates(
        '2026-10-01',
        {
          frequency: 'monthly',
          interval: 1,
          monthlyMode: 'weekday-position',
          weekday: 2,
          weekOfMonth: 2,
        },
        { kind: 'count', value: 2 },
      ),
    ).toEqual(['2026-10-13', '2026-11-10'])
  })

  it('rejects schedules above the agreed 365 occurrence limit', () => {
    expect(() =>
      generateRecurrenceDates(
        '2026-10-22',
        { frequency: 'daily', interval: 1 },
        { kind: 'count', value: 366 },
      ),
    ).toThrow('365')
  })
})
