import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useEvent } from '@src/hooks/useEvent'
import { useSetEventResponse } from '@src/hooks/useSetEventResponse'
import EventDetailPage, {
  EventDetailErrorPage,
  EventDetailLoadingPage,
  EventDetailNotFoundPage,
} from '@src/pages/EventDetailPage'

function EventDetailRoute() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const eventQuery = useEvent(eventId)
  const responseMutation = useSetEventResponse()
  const backPath = eventQuery.data?.flockId
    ? `/flocks/${eventQuery.data.flockId}#flock-events`
    : '/events'

  useEffect(() => {
    document.title = eventQuery.data
      ? `${eventQuery.data.title} — Flock`
      : 'Event details — Flock'
    return () => {
      document.title = 'Flock'
    }
  }, [eventQuery.data])

  const onBack = () => navigate(backPath)
  if (eventQuery.isPending) return <EventDetailLoadingPage />
  if (eventQuery.isError) {
    return <EventDetailErrorPage onRetry={() => void eventQuery.refetch()} />
  }
  if (!eventQuery.data) return <EventDetailNotFoundPage onBack={onBack} />

  return (
    <EventDetailPage
      event={eventQuery.data}
      isResponding={responseMutation.isPending}
      onBack={onBack}
      onRespond={async (eventIdToUpdate, response, runOptionId) => {
        await responseMutation.mutateAsync({
          eventId: eventIdToUpdate,
          response,
          runOptionId,
        })
      }}
      responseError={
        responseMutation.isError
          ? 'We could not save your response. Check your connection and try again.'
          : undefined
      }
    />
  )
}

export default EventDetailRoute
