import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { useProfile } from '@src/hooks/useProfile'
import { useUpdateProfile } from '@src/hooks/useUpdateProfile'
import { profileQueryKeys } from '@src/data/queryKeys'
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
  const queryClient = useQueryClient()
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
      onAvatarUrlChange={(avatarUrl) => {
        if (!profileQuery.data) return
        queryClient.setQueryData(profileQueryKeys.current, {
          ...profileQuery.data,
          avatarUrl,
        })
      }}
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
