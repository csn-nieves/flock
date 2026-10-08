import type {
  CreateFlockInput,
  FlockSummary,
  UpdateFlockInput,
} from '@src/types/flocks'

import { supabase } from './supabase'
import { flockImagePath, getImageUrl, uploadImage } from './media'

const flockSummaryColumns = 'description, id, location, name, owner_id'

export async function createFlock(
  input: CreateFlockInput,
): Promise<FlockSummary> {
  const { imageFile, ...details } = input
  const { data, error } = await supabase
    .from('flocks')
    .insert(details)
    .select(flockSummaryColumns)
    .single()

  if (error) {
    throw error
  }

  const imageUrl = imageFile
    ? await uploadImage(flockImagePath(data.id), imageFile)
    : null
  return { ...data, ...(imageUrl ? { imageUrl } : {}) }
}

export async function listFlocks(): Promise<FlockSummary[]> {
  const { data, error } = await supabase
    .from('flocks')
    .select(flockSummaryColumns)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return Promise.all(
    data.map(async (flock) => {
      const imageUrl = await getImageUrl(flockImagePath(flock.id))
      return { ...flock, ...(imageUrl ? { imageUrl } : {}) }
    }),
  )
}

export async function getFlock(flockId: string): Promise<FlockSummary | null> {
  const { data, error } = await supabase
    .from('flocks')
    .select(flockSummaryColumns)
    .eq('id', flockId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) return null
  const imageUrl = await getImageUrl(flockImagePath(data.id))
  return { ...data, ...(imageUrl ? { imageUrl } : {}) }
}

export async function updateFlock({
  description,
  flockId,
  imageFile,
  location,
  name,
}: UpdateFlockInput): Promise<FlockSummary> {
  const { data, error } = await supabase
    .from('flocks')
    .update({ description, location, name })
    .eq('id', flockId)
    .select(flockSummaryColumns)
    .single()

  if (error) {
    throw error
  }

  const imageUrl = imageFile
    ? await uploadImage(flockImagePath(data.id), imageFile)
    : await getImageUrl(flockImagePath(data.id))
  return { ...data, ...(imageUrl ? { imageUrl } : {}) }
}
