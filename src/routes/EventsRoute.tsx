import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCreateUserEvent } from '@src/hooks/useCreateUserEvent'
import { useCreateEventInvitation } from '@src/hooks/useCreateEventInvitation'
import { useSetUserEventResponse } from '@src/hooks/useSetUserEventResponse'
import { useUpdateUserEvent } from '@src/hooks/useUpdateUserEvent'
import { useCancelUserEvent } from '@src/hooks/useCancelUserEvent'
import { useUserEvents } from '@src/hooks/useUserEvents'
import EventsPage, {
  EventsErrorPage,
  EventsLoadingPage,
} from '@src/pages/EventsPage'
import type { ShareInvitationResult } from '@src/pages/flocks/InvitationLinkCard'

function EventsRoute() {
  const eventsQuery = useUserEvents()
  const createMutation = useCreateUserEvent()
  const invitationMutation = useCreateEventInvitation()
  const responseMutation = useSetUserEventResponse()
  const updateMutation = useUpdateUserEvent()
  const cancelMutation = useCancelUserEvent()
  const [invitationUrl, setInvitationUrl] = useState<string>()
  const navigate = useNavigate()
  const title = useMemo(() => {
    if (eventsQuery.isPending) return 'Loading events… — Flock'
    if (eventsQuery.isError) return 'Events unavailable — Flock'
    return 'Your events — Flock'
  }, [eventsQuery.isError, eventsQuery.isPending])

  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (eventsQuery.isPending) return <EventsLoadingPage />
  if (eventsQuery.isError)
    return (
      <EventsErrorPage
        isRetrying={eventsQuery.isFetching}
        onRetry={() => void eventsQuery.refetch()}
      />
    )

  return (
    <EventsPage
      events={eventsQuery.data}
      isRefreshing={eventsQuery.isFetching}
      isCreating={createMutation.isPending}
      createError={
        createMutation.isError
          ? 'We could not create this event. Check your connection and try again.'
          : undefined
      }
      invitationUrl={invitationUrl}
      invitationError={
        invitationMutation.isError
          ? 'We could not create an invitation. Check your connection and try again.'
          : undefined
      }
      isInviting={invitationMutation.isPending}
      onInvite={(eventId) =>
        invitationMutation.mutate(eventId, {
          onSuccess: ({ token }) =>
            setInvitationUrl(
              new URL(
                `/event-invitations/${encodeURIComponent(token)}`,
                window.location.origin,
              ).toString(),
            ),
        })
      }
      onCopyInvitation={async (url) => {
        await navigator.clipboard.writeText(url)
      }}
      onShareInvitation={
        typeof navigator.share === 'function'
          ? async (url): Promise<ShareInvitationResult> => {
              try {
                await navigator.share({
                  text: 'Join my event on Flock.',
                  title: 'Join my event on Flock',
                  url,
                })
                return 'shared'
              } catch (error) {
                if (
                  error instanceof DOMException &&
                  error.name === 'AbortError'
                ) {
                  return 'cancelled'
                }
                throw error
              }
            }
          : undefined
      }
      isResponding={responseMutation.isPending}
      responseError={
        responseMutation.isError
          ? 'We could not save your response. Check your connection and try again.'
          : undefined
      }
      onRespond={(eventId, response) =>
        responseMutation.mutate({ eventId, response })
      }
      isSaving={updateMutation.isPending}
      managementError={
        updateMutation.isError || cancelMutation.isError
          ? 'We could not update this event. Check your connection and try again.'
          : undefined
      }
      onUpdate={async (eventId, input) => {
        await updateMutation.mutateAsync({ eventId, input })
      }}
      onCancelEvent={(eventId) => {
        cancelMutation.mutate(eventId)
      }}
      onCreate={async (input) => {
        await createMutation.mutateAsync(input)
        navigate('/events', { replace: true })
      }}
    />
  )
}

export default EventsRoute
