import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useAdminFlocks, useAdminUsers } from '@src/hooks/useAdminDashboard'
import { useDeleteAdminFlock } from '@src/hooks/useDeleteAdminFlock'
import AdminPage from '@src/pages/AdminPage'

function AdminRoute() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const flocks = useAdminFlocks()
  const users = useAdminUsers()
  const deleteFlock = useDeleteAdminFlock()

  useEffect(() => {
    document.title = 'Admin — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [])
  useEffect(() => {
    if (!isSuperadmin) navigate('/flocks', { replace: true })
  }, [isSuperadmin, navigate])
  if (!isSuperadmin) return null
  if (flocks.isPending || users.isPending)
    return (
      <p className="mx-auto max-w-4xl py-12" role="status">
        Loading admin data…
      </p>
    )
  if (flocks.isError || users.isError)
    return (
      <p className="mx-auto max-w-4xl py-12 text-text" role="alert">
        We could not load admin data.
      </p>
    )
  return (
    <AdminPage
      flocks={flocks.data}
      users={users.data}
      isDeleting={deleteFlock.isPending}
      onDeleteFlock={(id) => deleteFlock.mutateAsync(id)}
    />
  )
}

export default AdminRoute
