import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'

import { InvitationUnavailableError } from '@src/data/invitations'
import { useAcceptFlockInvitation } from '@src/hooks/useAcceptFlockInvitation'
import {
  FlockInvitationAcceptanceErrorPage,
  FlockInvitationJoiningPage,
  FlockInvitationUnavailablePage,
} from '@src/pages/flocks/AcceptFlockInvitationPage'

function AcceptFlockInvitationRoute() {
  const { invitationToken } = useParams<{ invitationToken: string }>()
  const invitationMutation = useAcceptFlockInvitation()
  const attemptedTokenRef = useRef<string | undefined>(undefined)
  const navigate = useNavigate()
  const onBack = () => navigate('/flocks', { replace: true })
  const isUnavailable =
    invitationToken === undefined ||
    invitationMutation.error instanceof InvitationUnavailableError
  let title = 'Joining flock… — Flock'

  if (isUnavailable) {
    title = 'Invitation unavailable — Flock'
  } else if (invitationMutation.isError) {
    title = 'Could not join flock — Flock'
  }

  const acceptInvitation = useCallback(() => {
    if (invitationToken === undefined) {
      return
    }

    invitationMutation.mutate(invitationToken, {
      onSuccess: (flock) => {
        navigate(`/flocks/${encodeURIComponent(flock.id)}`, { replace: true })
      },
    })
  }, [invitationMutation, invitationToken, navigate])

  useEffect(() => {
    document.title = title

    return () => {
      document.title = 'Flock'
    }
  }, [title])

  useEffect(() => {
    if (
      invitationToken === undefined ||
      attemptedTokenRef.current === invitationToken
    ) {
      return
    }

    attemptedTokenRef.current = invitationToken
    acceptInvitation()
  }, [acceptInvitation, invitationToken])

  if (isUnavailable) {
    return <FlockInvitationUnavailablePage onBack={onBack} />
  }

  if (invitationMutation.isError) {
    return (
      <FlockInvitationAcceptanceErrorPage
        isRetrying={invitationMutation.isPending}
        onBack={onBack}
        onRetry={acceptInvitation}
      />
    )
  }

  return <FlockInvitationJoiningPage onBack={onBack} />
}

export default AcceptFlockInvitationRoute
