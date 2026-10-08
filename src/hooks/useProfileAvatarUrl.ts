import { useEffect, useState } from 'react'

import { getImageUrl, profileImagePath } from '@src/data/media'

const avatarCache = new Map<string, string | null>()
const avatarRequests = new Map<string, Promise<string | null>>()

function loadProfileAvatarUrl(userId: string) {
  const existingRequest = avatarRequests.get(userId)
  if (existingRequest) return existingRequest

  const request = getImageUrl(profileImagePath(userId))
    .catch(() => null)
    .then((url) => {
      avatarCache.set(userId, url)
      avatarRequests.delete(userId)
      return url
    })
  avatarRequests.set(userId, request)
  return request
}

export function useProfileAvatarUrl(userId: string) {
  const [loadedAvatar, setLoadedAvatar] = useState<{
    url: string | null
    userId: string
  }>({ url: null, userId: '' })

  useEffect(() => {
    if (!userId || avatarCache.has(userId)) return

    let isCurrent = true
    void loadProfileAvatarUrl(userId).then((url) => {
      if (isCurrent) setLoadedAvatar({ url, userId })
    })
    return () => {
      isCurrent = false
    }
  }, [userId])

  return {
    data:
      avatarCache.get(userId) ??
      (loadedAvatar.userId === userId ? loadedAvatar.url : null),
  }
}
