import { useEffect, useState } from 'react'

export function useDebouncedValue<Value>(
  value: Value,
  delay: number,
  enabled = true,
) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    if (!enabled) return

    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, enabled, value])

  return debouncedValue
}
