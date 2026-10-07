import { useCallback, useEffect, useRef } from 'react'

import {
  findRouteCenter,
  isRoutePlanningConfigured,
  planWalkingSegment,
} from '@src/data/routePlanning'
import type { RouteCoordinate } from '@src/types/events'

export function useRoutePlanner() {
  const routeController = useRef<AbortController | undefined>(undefined)
  const locationController = useRef<AbortController | undefined>(undefined)

  useEffect(() => {
    return () => {
      routeController.current?.abort()
      locationController.current?.abort()
    }
  }, [])

  const planSegment = useCallback(
    async (from: RouteCoordinate, to: RouteCoordinate) => {
      routeController.current?.abort()
      routeController.current = new AbortController()
      return planWalkingSegment(from, to, routeController.current.signal)
    },
    [],
  )

  const locate = useCallback(async (location: string) => {
    locationController.current?.abort()
    locationController.current = new AbortController()
    return findRouteCenter(location, locationController.current.signal)
  }, [])

  return {
    isConfigured: isRoutePlanningConfigured(),
    locate,
    planSegment,
  }
}
