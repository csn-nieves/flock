const flockRootKey = ['flocks'] as const

export const flockQueryKeys = {
  all: flockRootKey,
  details: () => [...flockRootKey, 'detail'] as const,
  detail: (flockId: string) => [...flockQueryKeys.details(), flockId] as const,
  lists: () => [...flockRootKey, 'list'] as const,
}
