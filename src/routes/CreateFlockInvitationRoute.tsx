import { useEffect } from 'react'
import { useParams } from 'react-router'

import { useCreateFlockInvitation } from '@src/hooks/useCreateFlockInvitation'
import { useFlock } from '@src/hooks/useFlock'
import CreateFlockInvitationPage, {
  FlockInvitationErrorPage,
  FlockInvitationLoadingPage,
  FlockInvitationNotFoundPage,
} from '@src/pages/flocks/CreateFlockInvitationPage'
import type { FlockInvitationLink } from '@src/types/invitations'

const creationError =
  'We could not create an invitation. Check your connection and try again.'

function getInvitationLink(
  invitation: { expiresAt: string; token: string } | undefined,
): FlockInvitationLink | undefined {
  if (!invitation) {
    return undefined
  }

  return {
    ...invitation,
    url: new URL(
      `/invitations/${encodeURIComponent(invitation.token)}`,
      window.location.origin,
    ).toString(),
  }
}

function CreateFlockInvitationRoute() {
  const { flockId } = useParams<{ flockId: string }>()
  const flockQuery = useFlock(flockId)
  const invitationMutation = useCreateFlockInvitation()
  const invitation = getInvitationLink(invitationMutation.data)
  let title = 'Flock not found — Flock'

  if (flockId === undefined) {
    title = 'Flock not found — Flock'
  } else if (flockQuery.isPending) {
    title = 'Loading flock… — Flock'
  } else if (flockQuery.isError) {
    title = 'Flock unavailable — Flock'
  } else if (flockQuery.data) {
    title = `Invite to ${flockQuery.data.name} — Flock`
  }

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  if (flockId === undefined) {
    return <FlockInvitationNotFoundPage />
  }

  if (flockQuery.isPending) {
    return <FlockInvitationLoadingPage />
  }

  if (flockQuery.isError) {
    return (
      <FlockInvitationErrorPage
        isRetrying={flockQuery.isFetching}
        onRetry={() => void flockQuery.refetch()}
      />
    )
  }

  if (!flockQuery.data) {
    return <FlockInvitationNotFoundPage />
  }

  return (
    <CreateFlockInvitationPage
      error={invitationMutation.isError ? creationError : undefined}
      flock={flockQuery.data}
      invitation={invitation}
      isCreating={invitationMutation.isPending}
      onCopy={async (invitationUrl) => {
        await navigator.clipboard.writeText(invitationUrl)
      }}
      onCreate={() => invitationMutation.mutate(flockId)}
    />
  )
}

export default CreateFlockInvitationRoute
