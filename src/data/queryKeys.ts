const flockRootKey = ['flocks'] as const
const profileRootKey = ['profile'] as const

export const flockQueryKeys = {
  all: flockRootKey,
  details: () => [...flockRootKey, 'detail'] as const,
  detail: (flockId: string) => [...flockQueryKeys.details(), flockId] as const,
  lists: () => [...flockRootKey, 'list'] as const,
  memberLists: () => [...flockRootKey, 'members'] as const,
  members: (flockId: string) =>
    [...flockQueryKeys.memberLists(), flockId] as const,
}

export const profileQueryKeys = {
  current: profileRootKey,
}
