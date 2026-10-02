import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuthSession } from '@src/hooks/useAuthSession'
import {
  useAdminEvents,
  useAdminFlocks,
  useAdminUsers,
} from '@src/hooks/useAdminDashboard'
import { useDeleteAdminFlock } from '@src/hooks/useDeleteAdminFlock'
import { useCancelAdminEvent } from '@src/hooks/useCancelAdminEvent'
import { ADMIN_EVENTS_PAGE_SIZE } from '@src/data/admin'
import AdminPage, {
  AdminErrorPage,
  AdminLoadingPage,
} from '@src/pages/AdminPage'

function AdminRoute() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const pageParameter = searchParams.get('page')
  const parsedPage = Number(pageParameter ?? '1')
  const hasValidPageParameter =
    pageParameter === null ||
    (/^[1-9]\d*$/.test(pageParameter) && Number.isSafeInteger(parsedPage))
  const page = hasValidPageParameter ? parsedPage : 1
  const events = useAdminEvents(page)
  const flocks = useAdminFlocks()
  const users = useAdminUsers()
  const cancelEvent = useCancelAdminEvent()
  const deleteFlock = useDeleteAdminFlock()
  const isLoadingAdminData =
    events.isPending || flocks.isPending || users.isPending
  const hasAdminDataError = events.isError || flocks.isError || users.isError
  const totalEventPages = Math.max(
    1,
    Math.ceil(
      (events.data?.totalCount ?? ADMIN_EVENTS_PAGE_SIZE) /
        ADMIN_EVENTS_PAGE_SIZE,
    ),
  )
  let title = 'Admin — Flock'
  if (isLoadingAdminData) title = 'Loading admin… — Flock'
  else if (hasAdminDataError) title = 'Admin unavailable — Flock'

  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Flock'
    }
  }, [title])
  useEffect(() => {
    if (!isSuperadmin) navigate('/flocks', { replace: true })
  }, [isSuperadmin, navigate])
  useEffect(() => {
    if (!events.data) return
    if (!hasValidPageParameter) {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('page')
      setSearchParams(nextSearchParams, { replace: true })
      return
    }
    if (page <= totalEventPages) return

    const nextSearchParams = new URLSearchParams(searchParams)
    if (totalEventPages === 1) nextSearchParams.delete('page')
    else nextSearchParams.set('page', String(totalEventPages))
    setSearchParams(nextSearchParams, { replace: true })
  }, [
    events.data,
    hasValidPageParameter,
    page,
    searchParams,
    setSearchParams,
    totalEventPages,
  ])
  if (!isSuperadmin) return null
  if (isLoadingAdminData) return <AdminLoadingPage />
  if (hasAdminDataError)
    return (
      <AdminErrorPage
        isRetrying={events.isFetching || flocks.isFetching || users.isFetching}
        onRetry={() => {
          void Promise.all([
            events.refetch(),
            flocks.refetch(),
            users.refetch(),
          ])
        }}
      />
    )

  const changePage = (nextPage: number) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextPage === 1) nextSearchParams.delete('page')
    else nextSearchParams.set('page', String(nextPage))
    setSearchParams(nextSearchParams)
  }

  return (
    <AdminPage
      cancelEventError={
        cancelEvent.isError
          ? 'We could not cancel this event. Check your connection and try again.'
          : undefined
      }
      currentEventPage={page}
      events={events.data.events}
      flocks={flocks.data}
      isCancelingEvent={cancelEvent.isPending}
      users={users.data}
      isDeleting={deleteFlock.isPending}
      onCancelEvent={(id) => cancelEvent.mutateAsync(id)}
      onDeleteFlock={(id) => deleteFlock.mutateAsync(id)}
      onDismissCancelEventError={cancelEvent.reset}
      onEventPageChange={changePage}
      totalEventCount={events.data.totalCount}
      totalEventPages={totalEventPages}
    />
  )
}

export default AdminRoute
