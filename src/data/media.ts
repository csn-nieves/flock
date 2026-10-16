import { supabase } from './supabase'

const mediaBucket = 'flock-media'
const maximumImageBytes = 5 * 1024 * 1024
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const demoMedia = {
  profiles: [
    'runner-portrait-01.webp',
    'runner-portrait-02.webp',
    'runner-portrait-03.webp',
    'runner-portrait-04.webp',
    'runner-portrait-05.webp',
    'runner-portrait-06.webp',
  ],
  flocks: [
    'flock-runners-01.webp',
    'flock-runners-02.webp',
    'flock-runners-03.webp',
  ],
  events: [
    'event-riverside-01.webp',
    'event-riverside-02.webp',
    'event-trail-01.webp',
    'event-trail-02.webp',
    'event-waterfront-01.webp',
  ],
} as const

function demoMediaFallback(path: string, fallbackKey: string) {
  const [resource] = path.split('/')
  const assets = demoMedia[resource as keyof typeof demoMedia]
  if (!assets) return null

  const profileIndex =
    resource === 'profiles'
      ? [
          'demo runner',
          'jordan rivera',
          'maya chen',
          'priya shah',
          'theo brooks',
          'nina alvarez',
        ].indexOf(fallbackKey.trim().toLocaleLowerCase())
      : -1
  const hash = [...(fallbackKey || path)].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )
  return `/demo-media/${assets[profileIndex >= 0 ? profileIndex : hash % assets.length]}`
}

async function getDemoMediaFallback(path: string, fallbackKey: string) {
  if (typeof supabase.auth?.getSession !== 'function') return null

  const { data } = await supabase.auth.getSession()
  if (
    !(data.session?.user as { is_anonymous?: boolean } | undefined)
      ?.is_anonymous
  ) {
    return null
  }

  return demoMediaFallback(path, fallbackKey)
}

export function validateImageFile(file: File) {
  if (!acceptedImageTypes.has(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.')
  }

  if (file.size > maximumImageBytes) {
    throw new Error('Choose an image smaller than 5 MB.')
  }
}

export async function uploadImage(path: string, file: File) {
  validateImageFile(file)
  const { error } = await supabase.storage
    .from(mediaBucket)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    })

  if (error) throw error
  return getImageUrl(path)
}

export async function getImageUrl(path: string, fallbackKey = path) {
  if (!supabase.storage) return null

  const separatorIndex = path.lastIndexOf('/')
  const folder = separatorIndex === -1 ? '' : path.slice(0, separatorIndex)
  const filename = separatorIndex === -1 ? path : path.slice(separatorIndex + 1)
  const { data: files, error: listError } = await supabase.storage
    .from(mediaBucket)
    .list(folder, { limit: 1, search: filename })

  if (listError || !files.some((file) => file.name === filename)) {
    return getDemoMediaFallback(path, fallbackKey)
  }

  const { data, error } = await supabase.storage
    .from(mediaBucket)
    .createSignedUrl(path, 60 * 60)

  if (error) return null
  return data.signedUrl
}

export async function removeImage(path: string) {
  const { error } = await supabase.storage.from(mediaBucket).remove([path])
  if (error) throw error
}

export function profileImagePath(userId: string) {
  return `profiles/${userId}/avatar`
}

export function flockImagePath(flockId: string) {
  return `flocks/${flockId}/cover`
}

export function eventImagePath(eventId: string) {
  return `events/${eventId}/cover`
}
