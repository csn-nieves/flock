import { useQuery } from '@tanstack/react-query'
import { searchFlocks, searchRunners } from '@src/data/discovery'
import { discoveryQueryKeys } from '@src/data/queryKeys'

export function useRunnerSearch(term: string, location = '', enabled = true) {
  const normalized = term.trim()
  const normalizedLocation = location.trim()
  return useQuery({
    enabled: enabled && normalized.length >= 2,
    queryFn: () => searchRunners(normalized, normalizedLocation),
    queryKey: discoveryQueryKeys.runners(normalized, normalizedLocation),
  })
}

export function useFlockSearch(term: string, location = '', enabled = true) {
  const normalized = term.trim()
  const normalizedLocation = location.trim()
  return useQuery({
    enabled: enabled && normalized.length >= 2,
    queryFn: () => searchFlocks(normalized, normalizedLocation),
    queryKey: discoveryQueryKeys.flocks(normalized, normalizedLocation),
  })
}
