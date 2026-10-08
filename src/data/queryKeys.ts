const flockRootKey = ['flocks'] as const
const profileRootKey = ['profile'] as const
const eventRootKey = ['events'] as const
const savedRouteRootKey = ['saved-routes'] as const
const flockChatRootKey = ['flock-chat'] as const
const directChatRootKey = ['direct-chat'] as const

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

export const eventQueryKeys = {
  invitations: () => [...eventRootKey, 'invitations'] as const,
  mine: () => [...eventRootKey, 'mine'] as const,
  flock: (flockId: string) => [...eventRootKey, flockId] as const,
}

export const savedRouteQueryKeys = {
  all: savedRouteRootKey,
}

export const flockChatQueryKeys = {
  lists: () => [...flockChatRootKey, 'list'] as const,
  messages: (flockId: string) => [...flockChatRootKey, flockId] as const,
}

export const directChatQueryKeys = {
  lists: () => [...directChatRootKey, 'list'] as const,
  messages: (conversationId: string) =>
    [...directChatRootKey, conversationId] as const,
}

export const discoveryQueryKeys = {
  runners: (term: string) => ['discovery', 'runners', term] as const,
  flocks: (term: string) => ['discovery', 'flocks', term] as const,
}
