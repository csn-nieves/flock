import type { Tables, TablesInsert } from './database'

export type FlockSummary = Pick<Tables<'flocks'>, 'id' | 'name' | 'owner_id'>

export type CreateFlockInput = Pick<TablesInsert<'flocks'>, 'name'>
