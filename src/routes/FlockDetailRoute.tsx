import { useEffect } from 'react'
import { useParams } from 'react-router'

import { useFlock } from '@src/hooks/useFlock'
import FlockDetailPage, {
  FlockDetailErrorPage,
  FlockDetailLoadingPage,
  FlockDetailNotFoundPage,
} from '@src/pages/flocks/FlockDetailPage'

function FlockDetailRoute() {
  const { flockId } = useParams<{ flockId: string }>()
  const flockQuery = useFlock(flockId)
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
    return <FlockDetailNotFoundPage />
  }

  if (flockQuery.isPending) {
    return <FlockDetailLoadingPage />
  }

  if (flockQuery.isError) {
    return (
      <FlockDetailErrorPage
        isRetrying={flockQuery.isFetching}
        onRetry={() => void flockQuery.refetch()}
      />
    )
  }

  if (!flockQuery.data) {
    return <FlockDetailNotFoundPage />
  }

  return (
    <FlockDetailPage
      flock={flockQuery.data}
      isRefreshing={flockQuery.isFetching}
    />
  )
}

export default FlockDetailRoute
