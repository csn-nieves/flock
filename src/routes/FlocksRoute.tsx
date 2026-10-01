import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useFlocks } from '@src/hooks/useFlocks'
import FlocksPage, {
  FlocksErrorPage,
  FlocksLoadingPage,
} from '@src/pages/flocks/FlocksPage'

const pageTitles = {
  error: 'Flocks unavailable — Flock',
  loading: 'Loading flocks… — Flock',
  success: 'Your flocks — Flock',
}

function FlocksRoute() {
  const flocksQuery = useFlocks()
  const navigate = useNavigate()
  let status: keyof typeof pageTitles

  if (flocksQuery.isPending) {
    status = 'loading'
  } else if (flocksQuery.isError) {
    status = 'error'
  } else {
    status = 'success'
  }

  const title = pageTitles[status]

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (flocksQuery.isPending) {
    return <FlocksLoadingPage />
  }

  if (flocksQuery.isError) {
    return (
      <FlocksErrorPage
        isRetrying={flocksQuery.isFetching}
        onRetry={() => void flocksQuery.refetch()}
      />
    )
  }

  return (
    <FlocksPage
      flocks={flocksQuery.data}
      isRefreshing={flocksQuery.isFetching}
      onCreate={() => navigate('/flocks/new')}
      onProfile={() => navigate('/profile')}
      onSelect={(flockId) => navigate(`/flocks/${encodeURIComponent(flockId)}`)}
    />
  )
}

export default FlocksRoute
