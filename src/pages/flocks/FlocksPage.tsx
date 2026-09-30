import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useFlocks } from '@src/hooks/useFlocks'
import type { FlocksPageState } from './FlocksPageContent'
import FlocksPageView from './FlocksPageView'

const pageTitles: Record<FlocksPageState['status'], string> = {
  error: 'Flocks unavailable — Flock',
  loading: 'Loading flocks… — Flock',
  success: 'Your flocks — Flock',
}

function FlocksPage() {
  const flocksQuery = useFlocks()
  const navigate = useNavigate()
  let state: FlocksPageState

  if (flocksQuery.isPending) {
    state = { status: 'loading' }
  } else if (flocksQuery.isError) {
    state = {
      isRetrying: flocksQuery.isFetching,
      status: 'error',
    }
  } else {
    state = {
      flocks: flocksQuery.data,
      isRefreshing: flocksQuery.isFetching,
      status: 'success',
    }
  }

  const title = pageTitles[state.status]

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  return (
    <FlocksPageView
      state={state}
      onCreate={() => navigate('/flocks/new')}
      onRetry={() => void flocksQuery.refetch()}
      onSelect={(flockId) => navigate(`/flocks/${encodeURIComponent(flockId)}`)}
    />
  )
}

export default FlocksPage
