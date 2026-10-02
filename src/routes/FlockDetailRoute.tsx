import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import Modal from '@src/components/Modal'
import { useFlock } from '@src/hooks/useFlock'
import { useFlockMembers } from '@src/hooks/useFlockMembers'
import { useFlockEvents } from '@src/hooks/useFlockEvents'
import { useCreateFlockEvent } from '@src/hooks/useCreateFlockEvent'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useSetFlockEventResponse } from '@src/hooks/useSetFlockEventResponse'
import { useUpdateFlockEvent } from '@src/hooks/useUpdateFlockEvent'
import { useCancelFlockEvent } from '@src/hooks/useCancelFlockEvent'
import { useCreateFlockInvitation } from '@src/hooks/useCreateFlockInvitation'
import FlockDetailPage, {
  FlockDetailErrorPage,
  FlockDetailLoadingPage,
  FlockDetailNotFoundPage,
} from '@src/pages/flocks/FlockDetailPage'
import type { FlockMemberListState } from '@src/pages/flocks/FlockMembersSection'
import CreateFlockInvitationPage from '@src/pages/flocks/CreateFlockInvitationPage'

function FlockDetailRoute() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const { flockId } = useParams<{ flockId: string }>()
  const flockQuery = useFlock(flockId)
  const membersQuery = useFlockMembers(flockId)
  const eventsQuery = useFlockEvents(flockId)
  const createEventMutation = useCreateFlockEvent(flockId ?? '')
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const responseMutation = useSetFlockEventResponse(flockId ?? '')
  const updateEventMutation = useUpdateFlockEvent(flockId ?? '')
  const cancelEventMutation = useCancelFlockEvent(flockId ?? '')
  const invitationMutation = useCreateFlockInvitation()
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

  const invitation = invitationMutation.data
    ? {
        ...invitationMutation.data,
        url: new URL(
          `/invitations/${encodeURIComponent(invitationMutation.data.token)}`,
          window.location.origin,
        ).toString(),
      }
    : undefined

  return (
    <>
      <FlockDetailPage
        flock={flockQuery.data}
        isRefreshing={flockQuery.isFetching}
        memberList={memberList}
        onBack={onBack}
        onInvite={() => setIsInviteOpen(true)}
        onRetryMembers={() => void membersQuery.refetch()}
        events={{
          canCreate: Boolean(
            isSuperadmin ||
            (session?.user.id && session.user.id === flockQuery.data.owner_id),
          ),
          error:
            eventsQuery.isError || createEventMutation.isError
              ? 'Events are unavailable.'
              : undefined,
          editError: updateEventMutation.isError
            ? 'Event update failed.'
            : undefined,
          events: eventsQuery.data,
          isLoading: eventsQuery.isPending,
          isSaving:
            createEventMutation.isPending || updateEventMutation.isPending,
          isCanceling: cancelEventMutation.isPending,
          onCreate: (input) => createEventMutation.mutate(input),
          onCancel: async (eventId) => {
            await cancelEventMutation.mutateAsync(eventId)
          },
          onRetry: () => void eventsQuery.refetch(),
          onRespond: (eventId, response) =>
            responseMutation.mutate({ eventId, response }),
          onUpdate: async (eventId, input) => {
            await updateEventMutation.mutateAsync({ eventId, input })
          },
        }}
      />
      {isInviteOpen ? (
        <Modal
          description={`Create a single-use link for ${flockQuery.data?.name ?? 'this flock'}.`}
          onClose={() => setIsInviteOpen(false)}
          title="Invite a runner"
        >
          <CreateFlockInvitationPage
            error={
              invitationMutation.isError
                ? 'We could not create an invitation. Check your connection and try again.'
                : undefined
            }
            flock={flockQuery.data}
            invitation={invitation}
            isCreating={invitationMutation.isPending}
            onBack={() => setIsInviteOpen(false)}
            onCopy={async (url) => {
              await navigator.clipboard.writeText(url)
            }}
            onCreate={() => invitationMutation.mutate(flockId)}
            onShare={undefined}
          />
        </Modal>
      ) : null}
    </>
  )
}

export default FlockDetailRoute
