import { supabase } from './supabase'
import type { RouteCoordinate } from '@src/types/events'
import type { SavedRoute } from '@src/types/savedRoutes'

type SavedRouteRow = {
  created_at: string
  id: string
  name: string
  route_coordinates: unknown
  route_distance_meters: number
  updated_at: string
}

function toSavedRoute(row: SavedRouteRow): SavedRoute {
  return {
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    route: {
      coordinates: row.route_coordinates as RouteCoordinate[],
      distanceMeters: row.route_distance_meters,
    },
    updatedAt: row.updated_at,
  }
}

export async function listSavedRoutes(): Promise<SavedRoute[]> {
  const { data, error } = await supabase
    .from('saved_routes')
    .select(
      'id, name, route_coordinates, route_distance_meters, created_at, updated_at',
    )
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(toSavedRoute)
}

export async function createSavedRoute(input: {
  name: string
  route: SavedRoute['route']
}): Promise<SavedRoute> {
  const { data, error } = await supabase.rpc('create_saved_route', {
    route_coordinates: input.route.coordinates,
    route_distance_meters: input.route.distanceMeters,
    route_name: input.name,
  })
  if (error) throw error
  return toSavedRoute(data)
}

export async function renameSavedRoute(input: {
  name: string
  routeId: string
}): Promise<SavedRoute> {
  const { data, error } = await supabase.rpc('rename_saved_route', {
    route_name: input.name,
    target_route_id: input.routeId,
  })
  if (error) throw error
  return toSavedRoute(data)
}

export async function deleteSavedRoute(routeId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_saved_route', {
    target_route_id: routeId,
  })
  if (error) throw error
}
