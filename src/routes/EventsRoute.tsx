import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCreateUserEvent } from '@src/hooks/useCreateUserEvent'
import {
  useCreateFlockEventInvitation,
  useCreateTargetedEventInvitation,
} from '@src/hooks/useCreateEventInvitation'
import { useAcceptEventInvitationById } from '@src/hooks/useAcceptEventInvitation'
import { usePendingEventInvitations } from '@src/hooks/usePendingEventInvitations'
import { useAuthSession } from '@src/hooks/useAuthSession'
import { useFlockSearch, useRunnerSearch } from '@src/hooks/useDiscoverySearch'
import { useSetUserEventResponse } from '@src/hooks/useSetUserEventResponse'
import { useUpdateUserEvent } from '@src/hooks/useUpdateUserEvent'
import { useCancelUserEvent } from '@src/hooks/useCancelUserEvent'
import { useUserEvents } from '@src/hooks/useUserEvents'
import { useSavedRouteLibrary } from '@src/hooks/useSavedRouteLibrary'
import EventsPage, {
  EventsErrorPage,
  EventsLoadingPage,
} from '@src/pages/EventsPage'
import type { EventAudienceType } from '@src/components/EventAudiencePicker'
import type { ShareInvitationResult } from '@src/pages/flocks/InvitationLinkCard'
import type { EventAudienceInvitationLink } from '@src/types/invitations'

function EventsRoute() {
  const { session } = useAuthSession()
  const eventsQuery = useUserEvents()
  const createMutation = useCreateUserEvent()
  const targetedInvitationMutation = useCreateTargetedEventInvitation()
  const flockInvitationMutation = useCreateFlockEventInvitation()
  const pendingInvitationsQuery = usePendingEventInvitations()
  const acceptInvitationMutation = useAcceptEventInvitationById()
  const responseMutation = useSetUserEventResponse()
  const updateMutation = useUpdateUserEvent()
  const cancelMutation = useCancelUserEvent()
  const savedRouteLibrary = useSavedRouteLibrary()
  const [audienceType, setAudienceType] = useState<EventAudienceType>('runner')
  const [audienceSearchTerm, setAudienceSearchTerm] = useState('')
  const [invitationLink, setInvitationLink] = useState<
    EventAudienceInvitationLink | undefined
  >()
  const runnerSearch = useRunnerSearch(
    audienceType === 'runner' ? audienceSearchTerm : '',
  )
  const flockSearch = useFlockSearch(
    audienceType === 'flock' ? audienceSearchTerm : '',
  )
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

  let invitationError
  if (targetedInvitationMutation.isError || flockInvitationMutation.isError) {
    invitationError =
      'We could not create an invitation. Check your connection and try again.'
  } else if (audienceType === 'runner' && runnerSearch.isError) {
    invitationError =
      'We could not search runners. Check your connection and try again.'
  } else if (audienceType === 'flock' && flockSearch.isError) {
    invitationError =
      'We could not search flocks. Check your connection and try again.'
  }

  let invitationInboxError
  if (pendingInvitationsQuery.isError) {
    invitationInboxError =
      'We could not load your event invitations. Check your connection and try again.'
  } else if (acceptInvitationMutation.isError) {
    invitationInboxError =
      'This invitation could not be accepted. It may have expired or your flock membership may have changed.'
  }

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
      audienceSearchTerm={audienceSearchTerm}
      audienceType={audienceType}
      canManageAllEvents={session?.user.app_metadata?.role === 'superadmin'}
      currentUserId={session?.user.id ?? ''}
      events={eventsQuery.data}
      flockResults={flockSearch.data ?? []}
      pendingInvitations={pendingInvitationsQuery.data ?? []}
      acceptingInvitationId={acceptInvitationMutation.variables}
      invitationInboxError={invitationInboxError}
      isLoadingInvitations={pendingInvitationsQuery.isPending}
      isRefreshingInvitations={pendingInvitationsQuery.isFetching}
      isRefreshing={eventsQuery.isFetching}
      isSearchingAudience={
        audienceType === 'runner'
          ? runnerSearch.isFetching
          : flockSearch.isFetching
      }
      runnerResults={runnerSearch.data ?? []}
      savedRouteLibrary={savedRouteLibrary}
      isCreating={createMutation.isPending}
      createError={
        createMutation.isError
          ? 'We could not create this event. Check your connection and try again.'
          : undefined
      }
      invitationLink={invitationLink}
      onCloseInvitation={() => setInvitationLink(undefined)}
      invitationError={invitationError}
      isInviting={
        targetedInvitationMutation.isPending ||
        flockInvitationMutation.isPending
      }
      onAudienceTypeChange={(nextAudienceType) => {
        setAudienceType(nextAudienceType)
        setAudienceSearchTerm('')
        targetedInvitationMutation.reset()
        flockInvitationMutation.reset()
      }}
      onAudienceSearchTermChange={(searchTerm) => {
        setAudienceSearchTerm(searchTerm)
        targetedInvitationMutation.reset()
        flockInvitationMutation.reset()
      }}
      onAcceptInvitation={async (invitationId) => {
        try {
          await acceptInvitationMutation.mutateAsync(invitationId)
        } catch (error) {
          await pendingInvitationsQuery.refetch()
          throw error
        }
      }}
      onInviteRunner={async (
        eventId,
        recipientUserId,
        recipientDisplayName,
      ) => {
        const invitation = await targetedInvitationMutation.mutateAsync({
          eventId,
          recipientUserId,
        })
        setInvitationLink({
          ...invitation,
          audienceName: recipientDisplayName,
          audienceType: 'runner',
          url: new URL(
            `/event-invitations/${encodeURIComponent(invitation.token)}`,
            window.location.origin,
          ).toString(),
        })
      }}
      onInviteFlock={async (eventId, flockId, flockName) => {
        const invitation = await flockInvitationMutation.mutateAsync({
          eventId,
          flockId,
        })
        setInvitationLink({
          ...invitation,
          audienceName: flockName,
          audienceType: 'flock',
          url: new URL(
            `/event-invitations/${encodeURIComponent(invitation.token)}`,
            window.location.origin,
          ).toString(),
        })
      }}
      onRetryInvitations={() => {
        acceptInvitationMutation.reset()
        void pendingInvitationsQuery.refetch()
      }}
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
      onRespond={(eventId, response, runOptionId) =>
        responseMutation.mutateAsync({ eventId, response, runOptionId })
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
      onCancelEvent={async (eventId) => {
        await cancelMutation.mutateAsync(eventId)
      }}
      onCreate={async (input) => {
        await createMutation.mutateAsync(input)
        navigate('/events', { replace: true })
      }}
    />
  )
}

export default EventsRoute
