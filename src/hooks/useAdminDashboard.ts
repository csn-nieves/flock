import { useQuery } from '@tanstack/react-query'
import {
  listAdminEvents,
  listAdminFlocks,
  listAdminUsers,
} from '@src/data/admin'

export function useAdminEvents(page: number) {
  return useQuery({
    queryFn: () => listAdminEvents(page),
    queryKey: ['admin', 'events', page],
  })
}

export function useAdminFlocks() {
  return useQuery({ queryFn: listAdminFlocks, queryKey: ['admin', 'flocks'] })
}

export function useAdminUsers() {
  return useQuery({ queryFn: listAdminUsers, queryKey: ['admin', 'users'] })
}
