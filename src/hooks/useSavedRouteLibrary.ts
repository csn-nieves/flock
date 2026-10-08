import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createSavedRoute,
  deleteSavedRoute,
  listSavedRoutes,
  renameSavedRoute,
} from '@src/data/savedRoutes'
import { savedRouteQueryKeys } from '@src/data/queryKeys'
import type { SavedRouteLibrary } from '@src/types/savedRoutes'

export function useSavedRouteLibrary(enabled = true): SavedRouteLibrary {
  const queryClient = useQueryClient()
  const routesQuery = useQuery({
    enabled,
    queryFn: listSavedRoutes,
    queryKey: savedRouteQueryKeys.all,
  })
  const invalidateRoutes = () =>
    queryClient.invalidateQueries({ queryKey: savedRouteQueryKeys.all })
  const saveMutation = useMutation({
    mutationFn: createSavedRoute,
    onSuccess: invalidateRoutes,
  })
  const renameMutation = useMutation({
    mutationFn: renameSavedRoute,
    onSuccess: invalidateRoutes,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteSavedRoute,
    onSuccess: invalidateRoutes,
  })

  let status: SavedRouteLibrary['status'] = 'ready'
  if (enabled && routesQuery.isPending) status = 'loading'
  if (routesQuery.isError) status = 'error'

  return {
    isDeleting: deleteMutation.isPending,
    isLoading: enabled && routesQuery.isPending,
    isRenaming: renameMutation.isPending,
    isSaving: saveMutation.isPending,
    routes: routesQuery.data ?? [],
    status,
    onDelete: async (routeId) => {
      await deleteMutation.mutateAsync(routeId)
    },
    onRename: async (routeId, name) => {
      await renameMutation.mutateAsync({ name, routeId })
    },
    onRetry: () => void routesQuery.refetch(),
    onSave: async (name, route) => {
      await saveMutation.mutateAsync({ name, route })
    },
  }
}
