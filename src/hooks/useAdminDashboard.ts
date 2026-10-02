import { useQuery } from '@tanstack/react-query'
import { listAdminFlocks, listAdminUsers } from '@src/data/admin'

export function useAdminFlocks() {
  return useQuery({ queryFn: listAdminFlocks, queryKey: ['admin', 'flocks'] })
}

export function useAdminUsers() {
  return useQuery({ queryFn: listAdminUsers, queryKey: ['admin', 'users'] })
}
