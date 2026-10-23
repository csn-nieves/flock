export type RecurrenceRule =
  | { frequency: 'daily'; interval: number }
  | { frequency: 'weekly'; interval: number; weekdays: number[] }
  | {
      frequency: 'monthly'
      interval: number
      monthlyMode: 'day-of-month' | 'weekday-position'
      dayOfMonth?: number
      weekday?: number
      weekOfMonth?: 1 | 2 | 3 | 4 | 5
    }

export type RecurrenceLimit =
  { kind: 'count'; value: number } | { kind: 'until'; value: string }

const MAX_OCCURRENCES = 365

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function addDays(value: Date, days: number) {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function addMonths(value: Date, months: number) {
  const result = new Date(value)
  result.setUTCMonth(result.getUTCMonth() + months, 1)
  return result
}

function monthlyCandidates(
  month: Date,
  rule: Extract<RecurrenceRule, { frequency: 'monthly' }>,
) {
  const year = month.getUTCFullYear()
  const monthIndex = month.getUTCMonth()

  if (rule.monthlyMode === 'day-of-month') {
    if (!rule.dayOfMonth || rule.dayOfMonth > daysInMonth(year, monthIndex)) {
      return []
    }
    return [new Date(Date.UTC(year, monthIndex, rule.dayOfMonth))]
  }

  if (rule.weekday === undefined || rule.weekOfMonth === undefined) {
    return []
  }

  const first = new Date(Date.UTC(year, monthIndex, 1))
  const offset = (rule.weekday - first.getUTCDay() + 7) % 7
  const day = 1 + offset + (rule.weekOfMonth - 1) * 7
  return day <= daysInMonth(year, monthIndex)
    ? [new Date(Date.UTC(year, monthIndex, day))]
    : []
}

export function generateRecurrenceDates(
  startDate: string,
  rule: RecurrenceRule,
  limit: RecurrenceLimit,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error('The recurrence start date must use YYYY-MM-DD format.')
  }
  if (
    limit.kind === 'count' &&
    (limit.value < 1 || limit.value > MAX_OCCURRENCES)
  ) {
    throw new Error(
      `A recurrence must contain between 1 and ${MAX_OCCURRENCES} occurrences.`,
    )
  }
  if (limit.kind === 'until' && !/^\d{4}-\d{2}-\d{2}$/.test(limit.value)) {
    throw new Error('The recurrence end date must use YYYY-MM-DD format.')
  }
  if (rule.interval < 1 || rule.interval > 4) {
    throw new Error('The recurrence interval must be between 1 and 4.')
  }

  const start = parseDate(startDate)
  const until = limit.kind === 'until' ? parseDate(limit.value) : null
  const dates: string[] = []
  let cursor = new Date(start)

  while (dates.length < MAX_OCCURRENCES) {
    if (until && cursor > until) break
    if (limit.kind === 'count' && dates.length >= limit.value) break

    if (rule.frequency === 'daily') {
      dates.push(formatDate(cursor))
      cursor = addDays(cursor, rule.interval)
      continue
    }

    if (rule.frequency === 'weekly') {
      const weekdays = [...new Set(rule.weekdays)].sort((a, b) => a - b)
      if (weekdays.some((day) => day < 0 || day > 6) || weekdays.length === 0) {
        throw new Error('Weekly recurrence requires at least one weekday.')
      }
      const weekStart = addDays(cursor, -cursor.getUTCDay())
      for (const weekday of weekdays) {
        const candidate = addDays(weekStart, weekday)
        if (candidate < start || (until && candidate > until)) continue
        if (limit.kind === 'count' && dates.length >= limit.value) break
        dates.push(formatDate(candidate))
      }
      cursor = addDays(weekStart, rule.interval * 7)
      continue
    }

    for (const candidate of monthlyCandidates(cursor, rule)) {
      if (candidate < start || (until && candidate > until)) continue
      dates.push(formatDate(candidate))
    }
    cursor = addMonths(cursor, rule.interval)
  }

  if (limit.kind === 'until' && dates.length === MAX_OCCURRENCES) {
    const next = dates[dates.length - 1]
    if (next < limit.value) {
      throw new Error(
        `A recurrence cannot contain more than ${MAX_OCCURRENCES} occurrences.`,
      )
    }
  }

  return dates
}
