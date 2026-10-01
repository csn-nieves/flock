import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useFlock } from '@src/hooks/useFlock'
import { useFlockMembers } from '@src/hooks/useFlockMembers'
import { useFlockEvents } from '@src/hooks/useFlockEvents'
import { useCreateFlockEvent } from '@src/hooks/useCreateFlockEvent'
import FlockDetailPage, {
  FlockDetailErrorPage,
  FlockDetailLoadingPage,
  FlockDetailNotFoundPage,
} from '@src/pages/flocks/FlockDetailPage'
import type { FlockMemberListState } from '@src/pages/flocks/FlockMembersSection'

function FlockDetailRoute() {
  const { flockId } = useParams<{ flockId: string }>()
  const flockQuery = useFlock(flockId)
  const membersQuery = useFlockMembers(flockId)
  const eventsQuery = useFlockEvents(flockId)
  const createEventMutation = useCreateFlockEvent(flockId ?? '')
  const navigate = useNavigate()
  const onBack = () => navigate('/flocks', { replace: true })
  let title = 'Flock not found — Flock'

  if (flockId === undefined) {
    title = 'Flock not found — Flock'
  } else if (flockQuery.isPending) {
    title = 'Loading flock… — Flock'
  } else if (flockQuery.isError) {
    title = 'Flock unavailable — Flock'
  } else if (flockQuery.data) {
    title = `${flockQuery.data.name} — Flock`
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (flockId === undefined) {
    return <FlockDetailNotFoundPage onBack={onBack} />
  }

  if (flockQuery.isPending) {
    return <FlockDetailLoadingPage onBack={onBack} />
  }

  if (flockQuery.isError) {
    return (
      <FlockDetailErrorPage
        isRetrying={flockQuery.isFetching}
        onBack={onBack}
        onRetry={() => void flockQuery.refetch()}
      />
    )
  }

  if (!flockQuery.data) {
    return <FlockDetailNotFoundPage onBack={onBack} />
  }

  let memberList: FlockMemberListState

  if (membersQuery.data !== undefined) {
    memberList = {
      hasRefreshError: membersQuery.isError,
      isRefreshing: membersQuery.isFetching && !membersQuery.isError,
      isRetrying: membersQuery.isFetching,
      members: membersQuery.data,
      status: 'ready',
    }
  } else if (membersQuery.isPending) {
    memberList = { status: 'loading' }
  } else {
    memberList = {
      isRetrying: membersQuery.isFetching,
      status: 'error',
    }
  }

  return (
    <FlockDetailPage
      flock={flockQuery.data}
      isRefreshing={flockQuery.isFetching}
      memberList={memberList}
      onBack={onBack}
      onInvite={() =>
        navigate(`/flocks/${encodeURIComponent(flockId)}/invitations/new`)
      }
      onRetryMembers={() => void membersQuery.refetch()}
      events={{
        error:
          eventsQuery.isError || createEventMutation.isError
            ? 'Events are unavailable.'
            : undefined,
        events: eventsQuery.data,
        isLoading: eventsQuery.isPending,
        isSaving: createEventMutation.isPending,
        onCreate: (input) => createEventMutation.mutate(input),
        onRetry: () => void eventsQuery.refetch(),
      }}
    />
  )
}

export default FlockDetailRoute
