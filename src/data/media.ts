import { supabase } from './supabase'

const mediaBucket = 'flock-media'
const maximumImageBytes = 5 * 1024 * 1024
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

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

export async function getImageUrl(path: string) {
  if (!supabase.storage) return null

  const separatorIndex = path.lastIndexOf('/')
  const folder = separatorIndex === -1 ? '' : path.slice(0, separatorIndex)
  const filename = separatorIndex === -1 ? path : path.slice(separatorIndex + 1)
  const { data: files, error: listError } = await supabase.storage
    .from(mediaBucket)
    .list(folder, { limit: 1, search: filename })

  if (listError || !files.some((file) => file.name === filename)) return null

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
