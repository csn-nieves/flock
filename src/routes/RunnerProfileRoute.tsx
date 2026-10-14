import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useAuthSession } from '@src/hooks/useAuthSession'
import { useRunnerProfile } from '@src/hooks/useProfile'
import RunnerProfilePage, {
  RunnerProfileErrorPage,
  RunnerProfileLoadingPage,
} from '@src/pages/RunnerProfilePage'

function RunnerProfileRoute() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { session } = useAuthSession()
  const profileQuery = useRunnerProfile(userId ?? '')
  const onBack = () => navigate('/discover', { replace: true })
  const title = profileQuery.data
    ? `${profileQuery.data.displayName} — Flock`
    : 'Runner profile — Flock'

  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (!userId || profileQuery.isPending) {
    return <RunnerProfileLoadingPage onBack={onBack} />
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <RunnerProfileErrorPage
        isRetrying={profileQuery.isFetching}
        onBack={onBack}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  return (
    <RunnerProfilePage
      isCurrentUser={session?.user.id === profileQuery.data.userId}
      onBack={onBack}
      onMessage={() =>
        navigate(
          `/chats/direct/new?runnerId=${encodeURIComponent(profileQuery.data.userId)}`,
        )
      }
      profile={profileQuery.data}
    />
  )
}

export default RunnerProfileRoute
