import type { Tables, TablesInsert } from './database'

export type FlockSummary = Pick<Tables<'flocks'>, 'id' | 'name' | 'owner_id'> &
  Partial<Pick<Tables<'flocks'>, 'description' | 'location'>> & {
    imageUrl?: string | null
  }

export type FlockDetailsInput = {
  description: string
  imageFile?: File
  location: string
  name: string
}

export type CreateFlockInput = Pick<
  TablesInsert<'flocks'>,
  'description' | 'location' | 'name'
> &
  Pick<FlockDetailsInput, 'imageFile'>

export type UpdateFlockInput = FlockDetailsInput & {
  flockId: string
}
