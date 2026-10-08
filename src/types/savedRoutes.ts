import type { EventRoute } from './events'

export type SavedRoute = {
  createdAt: string
  id: string
  name: string
  route: EventRoute
  updatedAt: string
}

export type SavedRouteLibrary = {
  isDeleting: boolean
  isLoading: boolean
  isRenaming: boolean
  isSaving: boolean
  routes: readonly SavedRoute[]
  status: 'error' | 'loading' | 'ready'
  onDelete: (routeId: string) => Promise<void>
  onRename: (routeId: string, name: string) => Promise<void>
  onRetry: () => void
  onSave: (name: string, route: EventRoute) => Promise<void>
}
