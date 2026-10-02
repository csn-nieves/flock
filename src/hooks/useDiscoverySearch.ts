import { useQuery } from '@tanstack/react-query'
import { searchFlocks, searchRunners } from '@src/data/discovery'
import { discoveryQueryKeys } from '@src/data/queryKeys'

export function useRunnerSearch(term: string) {
  const normalized = term.trim()
  return useQuery({
    enabled: normalized.length >= 2,
    queryFn: () => searchRunners(normalized),
    queryKey: discoveryQueryKeys.runners(normalized),
  })
}

export function useFlockSearch(term: string) {
  const normalized = term.trim()
  return useQuery({
    enabled: normalized.length >= 2,
    queryFn: () => searchFlocks(normalized),
    queryKey: discoveryQueryKeys.flocks(normalized),
  })
}
