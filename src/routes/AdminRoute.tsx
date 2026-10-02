import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuthSession } from '@src/hooks/useAuthSession'
import {
  useAdminEvents,
  useAdminFlocks,
  useAdminMemberships,
  useAdminUsers,
} from '@src/hooks/useAdminDashboard'
import { useDeleteAdminFlock } from '@src/hooks/useDeleteAdminFlock'
import { useCancelAdminEvent } from '@src/hooks/useCancelAdminEvent'
import { useRemoveAdminMembership } from '@src/hooks/useRemoveAdminMembership'
import {
  ADMIN_EVENTS_PAGE_SIZE,
  ADMIN_MEMBERSHIPS_PAGE_SIZE,
} from '@src/data/admin'
import AdminPage, {
  AdminErrorPage,
  AdminLoadingPage,
} from '@src/pages/AdminPage'

function AdminRoute() {
  const { session } = useAuthSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const { isValid: hasValidEventPage, page: eventPage } = parsePageParameter(
    searchParams.get('page'),
  )
  const { isValid: hasValidMembershipPage, page: membershipPage } =
    parsePageParameter(searchParams.get('membersPage'))
  const events = useAdminEvents(eventPage)
  const flocks = useAdminFlocks()
  const memberships = useAdminMemberships(membershipPage)
  const users = useAdminUsers()
  const cancelEvent = useCancelAdminEvent()
  const deleteFlock = useDeleteAdminFlock()
  const removeMembership = useRemoveAdminMembership()
  const isLoadingAdminData =
    events.isPending ||
    flocks.isPending ||
    memberships.isPending ||
    users.isPending
  const hasAdminDataError =
    events.isError || flocks.isError || memberships.isError || users.isError
  const totalEventPages = Math.max(
    1,
    Math.ceil(
      (events.data?.totalCount ?? ADMIN_EVENTS_PAGE_SIZE) /
        ADMIN_EVENTS_PAGE_SIZE,
    ),
  )
  const totalMembershipPages = Math.max(
    1,
    Math.ceil(
      (memberships.data?.totalCount ?? ADMIN_MEMBERSHIPS_PAGE_SIZE) /
        ADMIN_MEMBERSHIPS_PAGE_SIZE,
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
    const nextSearchParams = new URLSearchParams(searchParams)
    let shouldReplace = false

    if (events.data) {
      shouldReplace =
        normalizePageParameter({
          name: 'page',
          nextSearchParams,
          pageState: { isValid: hasValidEventPage, page: eventPage },
          totalPages: totalEventPages,
        }) || shouldReplace
    }

    if (memberships.data) {
      shouldReplace =
        normalizePageParameter({
          name: 'membersPage',
          nextSearchParams,
          pageState: {
            isValid: hasValidMembershipPage,
            page: membershipPage,
          },
          totalPages: totalMembershipPages,
        }) || shouldReplace
    }

    if (shouldReplace) setSearchParams(nextSearchParams, { replace: true })
  }, [
    events.data,
    eventPage,
    hasValidEventPage,
    hasValidMembershipPage,
    membershipPage,
    memberships.data,
    searchParams,
    setSearchParams,
    totalEventPages,
    totalMembershipPages,
  ])
  if (!isSuperadmin) return null
  if (isLoadingAdminData) return <AdminLoadingPage />
  if (hasAdminDataError)
    return (
      <AdminErrorPage
        isRetrying={
          events.isFetching ||
          flocks.isFetching ||
          memberships.isFetching ||
          users.isFetching
        }
        onRetry={() => {
          void Promise.all([
            events.refetch(),
            flocks.refetch(),
            memberships.refetch(),
            users.refetch(),
          ])
        }}
      />
    )

  const changePage = (name: 'membersPage' | 'page', nextPage: number) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextPage === 1) nextSearchParams.delete(name)
    else nextSearchParams.set(name, String(nextPage))
    setSearchParams(nextSearchParams)
  }

  return (
    <AdminPage
      cancelEventError={
        cancelEvent.isError
          ? 'We could not cancel this event. Check your connection and try again.'
          : undefined
      }
      currentEventPage={eventPage}
      currentMembershipPage={membershipPage}
      events={events.data.events}
      flocks={flocks.data}
      isCancelingEvent={cancelEvent.isPending}
      isDeleting={deleteFlock.isPending}
      isRemovingMembership={removeMembership.isPending}
      memberships={memberships.data.memberships}
      onCancelEvent={(id) => cancelEvent.mutateAsync(id)}
      onDeleteFlock={(id) => deleteFlock.mutateAsync(id)}
      onDismissCancelEventError={cancelEvent.reset}
      onDismissRemoveMembershipError={removeMembership.reset}
      onEventPageChange={(page) => changePage('page', page)}
      onMembershipPageChange={(page) => changePage('membersPage', page)}
      onRemoveMembership={(membership) =>
        removeMembership.mutateAsync({
          flockId: membership.flockId,
          userId: membership.userId,
        })
      }
      removeMembershipError={
        removeMembership.isError
          ? 'We could not remove this member. Check your connection and try again.'
          : undefined
      }
      totalEventCount={events.data.totalCount}
      totalEventPages={totalEventPages}
      totalMembershipCount={memberships.data.totalCount}
      totalMembershipPages={totalMembershipPages}
      users={users.data}
    />
  )
}

type PageParameterState = {
  isValid: boolean
  page: number
}

function parsePageParameter(parameter: string | null): PageParameterState {
  const parsedPage = Number(parameter ?? '1')
  const isValid =
    parameter === null ||
    (/^[1-9]\d*$/.test(parameter) && Number.isSafeInteger(parsedPage))

  return { isValid, page: isValid ? parsedPage : 1 }
}

function normalizePageParameter({
  name,
  nextSearchParams,
  pageState,
  totalPages,
}: {
  name: string
  nextSearchParams: URLSearchParams
  pageState: PageParameterState
  totalPages: number
}) {
  if (!pageState.isValid) {
    nextSearchParams.delete(name)
    return true
  }
  if (pageState.page <= totalPages) return false

  if (totalPages === 1) nextSearchParams.delete(name)
  else nextSearchParams.set(name, String(totalPages))
  return true
}

export default AdminRoute
