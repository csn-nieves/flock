import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import Modal from '@src/components/Modal'
import FlockDetailsForm from '@src/components/FlockDetailsForm'
import { useFlock } from '@src/hooks/useFlock'
import { useFlockMembers } from '@src/hooks/useFlockMembers'
import { useFlockEvents } from '@src/hooks/useFlockEvents'
import { useCreateFlockEvent } from '@src/hooks/useCreateFlockEvent'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useSetFlockEventResponse } from '@src/hooks/useSetFlockEventResponse'
import { useUpdateFlockEvent } from '@src/hooks/useUpdateFlockEvent'
import { useUpdateFlock } from '@src/hooks/useUpdateFlock'
import { useCancelFlockEvent } from '@src/hooks/useCancelFlockEvent'
import { useCreateFlockInvitation } from '@src/hooks/useCreateFlockInvitation'
import { useSavedRouteLibrary } from '@src/hooks/useSavedRouteLibrary'
import FlockDetailPage, {
  FlockDetailErrorPage,
  FlockDetailLoadingPage,
  FlockDetailNotFoundPage,
} from '@src/pages/flocks/FlockDetailPage'
import type { FlockMemberListState } from '@src/pages/flocks/FlockMembersSection'
import CreateFlockInvitationPage from '@src/pages/flocks/CreateFlockInvitationPage'

function FlockDetailRoute() {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string>()
  const { flockId } = useParams<{ flockId: string }>()
  const flockQuery = useFlock(flockId)
  const membersQuery = useFlockMembers(flockId)
  const eventsQuery = useFlockEvents(flockId)
  const createEventMutation = useCreateFlockEvent(flockId ?? '')
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const isSuperadmin = session?.user.app_metadata?.role === 'superadmin'
  const canCreateEvents = Boolean(
    isSuperadmin ||
    (session?.user.id && session.user.id === flockQuery.data?.owner_id),
  )
  const responseMutation = useSetFlockEventResponse(flockId ?? '')
  const updateEventMutation = useUpdateFlockEvent(flockId ?? '')
  const cancelEventMutation = useCancelFlockEvent(flockId ?? '')
  const invitationMutation = useCreateFlockInvitation()
  const updateFlockMutation = useUpdateFlock(flockId ?? '')
  const savedRouteLibrary = useSavedRouteLibrary(canCreateEvents)
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
        canEdit={session?.user.id === flockQuery.data.owner_id}
        flock={flockQuery.data}
        isRefreshing={flockQuery.isFetching}
        memberList={memberList}
        onBack={onBack}
        onEdit={() => {
          setSavedMessage(undefined)
          updateFlockMutation.reset()
          setIsEditOpen(true)
        }}
        onInvite={() => setIsInviteOpen(true)}
        onRetryMembers={() => void membersQuery.refetch()}
        savedMessage={savedMessage}
        events={{
          canCreate: canCreateEvents,
          createError: createEventMutation.isError
            ? 'We could not create this event. Check your connection and try again.'
            : undefined,
          error: eventsQuery.isError ? 'Events are unavailable.' : undefined,
          editError: updateEventMutation.isError
            ? 'Event update failed.'
            : undefined,
          events: eventsQuery.data,
          isLoading: eventsQuery.isPending,
          isSaving:
            createEventMutation.isPending || updateEventMutation.isPending,
          isCanceling: cancelEventMutation.isPending,
          isResponding: responseMutation.isPending,
          onCreate: async (input) => {
            await createEventMutation.mutateAsync(input)
          },
          onCancel: async (eventId) => {
            await cancelEventMutation.mutateAsync(eventId)
          },
          onRetry: () => void eventsQuery.refetch(),
          onRespond: async (eventId, response, runOptionId) => {
            await responseMutation.mutateAsync({
              eventId,
              response,
              runOptionId,
            })
          },
          onUpdate: async (eventId, input) => {
            await updateEventMutation.mutateAsync({ eventId, input })
          },
          responseError: responseMutation.isError
            ? 'We could not save your response. Check your connection and try again.'
            : undefined,
          respondingEventId: responseMutation.variables?.eventId,
          savedRouteLibrary,
        }}
      />
      {isEditOpen ? (
        <Modal
          description="Keep the group details current for every member."
          onClose={() => setIsEditOpen(false)}
          title="Edit flock details"
        >
          <FlockDetailsForm
            error={
              updateFlockMutation.isError
                ? 'Check your connection and try again. Your changes are still here.'
                : undefined
            }
            initialValues={{
              description: flockQuery.data.description ?? '',
              location: flockQuery.data.location ?? '',
              name: flockQuery.data.name,
            }}
            isSubmitting={updateFlockMutation.isPending}
            mode="edit"
            onCancel={() => setIsEditOpen(false)}
            onSubmit={(input) =>
              updateFlockMutation.mutate(
                { flockId, ...input },
                {
                  onSuccess: () => {
                    setIsEditOpen(false)
                    setSavedMessage('Flock details saved.')
                  },
                },
              )
            }
          />
        </Modal>
      ) : null}
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
