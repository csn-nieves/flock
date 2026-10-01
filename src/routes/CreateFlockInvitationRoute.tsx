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

function getEmailHref(flockName: string, invitationUrl?: string) {
  if (!invitationUrl) {
    return 'mailto:'
  }

  const subject = `Join ${flockName} on Flock`
  const body = `${subject}:\n\n${invitationUrl}`

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function isShareCancellation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}

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

  const flock = flockQuery.data
  const emailHref = getEmailHref(flock.name, invitation?.url)
  const onShare =
    invitation && typeof navigator.share === 'function'
      ? async (invitationUrl: string) => {
          const shareTitle = `Join ${flock.name} on Flock`

          try {
            await navigator.share({
              text: `Join ${flock.name} on Flock.`,
              title: shareTitle,
              url: invitationUrl,
            })
            return 'shared' as const
          } catch (error) {
            if (isShareCancellation(error)) {
              return 'cancelled' as const
            }

            throw error
          }
        }
      : undefined

  return (
    <CreateFlockInvitationPage
      emailHref={emailHref}
      error={invitationMutation.isError ? creationError : undefined}
      flock={flock}
      invitation={invitation}
      isCreating={invitationMutation.isPending}
      onCopy={async (invitationUrl) => {
        await navigator.clipboard.writeText(invitationUrl)
      }}
      onCreate={() => invitationMutation.mutate(flockId)}
      onShare={onShare}
    />
  )
}

export default CreateFlockInvitationRoute
