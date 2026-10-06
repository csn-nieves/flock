import type { Tables, TablesInsert } from './database'

export type FlockSummary = Pick<Tables<'flocks'>, 'id' | 'name' | 'owner_id'> &
  Partial<Pick<Tables<'flocks'>, 'description' | 'location'>>

export type FlockDetailsInput = {
  description: string
  location: string
  name: string
}

export type CreateFlockInput = Pick<
  TablesInsert<'flocks'>,
  'description' | 'location' | 'name'
>

export type UpdateFlockInput = FlockDetailsInput & {
  flockId: string
}
