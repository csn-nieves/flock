import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useCreateUserEvent } from '@src/hooks/useCreateUserEvent'
import { useUserEvents } from '@src/hooks/useUserEvents'
import EventsPage, {
  EventsErrorPage,
  EventsLoadingPage,
} from '@src/pages/EventsPage'

function EventsRoute() {
  const eventsQuery = useUserEvents()
  const createMutation = useCreateUserEvent()
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
      onCreate={async (input) => {
        await createMutation.mutateAsync(input)
        navigate('/events', { replace: true })
      }}
    />
  )
}

export default EventsRoute
