import { useEffect, useState } from 'react'

import { getImageUrl, profileImagePath } from '@src/data/media'

const avatarCache = new Map<string, string | null>()
const avatarRequests = new Map<string, Promise<string | null>>()

function loadProfileAvatarUrl(userId: string, displayName: string) {
  const cacheKey = `${userId}:${displayName}`
  const existingRequest = avatarRequests.get(cacheKey)
  if (existingRequest) return existingRequest

  const request = getImageUrl(profileImagePath(userId), displayName)
    .catch(() => null)
    .then((url) => {
      avatarCache.set(cacheKey, url)
      avatarRequests.delete(cacheKey)
      return url
    })
  avatarRequests.set(cacheKey, request)
  return request
}

export function useProfileAvatarUrl(userId: string, displayName: string) {
  const cacheKey = `${userId}:${displayName}`
  const [loadedAvatar, setLoadedAvatar] = useState<{
    url: string | null
    userId: string
  }>({ url: null, userId: '' })

  useEffect(() => {
    if (!userId || avatarCache.has(cacheKey)) return

    let isCurrent = true
    void loadProfileAvatarUrl(userId, displayName).then((url) => {
      if (isCurrent) setLoadedAvatar({ url, userId })
    })
    return () => {
      isCurrent = false
    }
  }, [cacheKey, displayName, userId])

  return {
    data:
      avatarCache.get(cacheKey) ??
      (loadedAvatar.userId === userId ? loadedAvatar.url : null),
  }
}
