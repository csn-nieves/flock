import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { useProfile } from '@src/hooks/useProfile'
import { useUpdateProfile } from '@src/hooks/useUpdateProfile'
import ProfilePage, {
  ProfileErrorPage,
  ProfileLoadingPage,
} from '@src/pages/ProfilePage'

const profileError =
  'We could not save your profile. Check your connection and try again.'

function ProfileRoute() {
  const profileQuery = useProfile()
  const updateProfileMutation = useUpdateProfile()
  const navigate = useNavigate()
  const [savedMessage, setSavedMessage] = useState<string>()
  let title = 'Your profile — Flock'

  if (profileQuery.isPending) {
    title = 'Loading profile… — Flock'
  } else if (profileQuery.isError) {
    title = 'Profile unavailable — Flock'
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (profileQuery.isPending) {
    return (
      <ProfileLoadingPage
        onBack={() => navigate('/flocks', { replace: true })}
      />
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileErrorPage
        isRetrying={profileQuery.isFetching}
        onBack={() => navigate('/flocks', { replace: true })}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  return (
    <ProfilePage
      error={updateProfileMutation.isError ? profileError : undefined}
      isSaving={updateProfileMutation.isPending}
      onBack={() => navigate('/flocks', { replace: true })}
      onSave={(input) => {
        setSavedMessage(undefined)
        updateProfileMutation.mutate(input, {
          onSuccess: () => setSavedMessage('Profile saved.'),
        })
      }}
      profile={profileQuery.data}
      savedMessage={savedMessage}
    />
  )
}

export default ProfileRoute
