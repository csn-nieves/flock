import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { InvitationUnavailableError } from '@src/data/invitations'
import { useAcceptEventInvitation } from '@src/hooks/useAcceptEventInvitation'
import Button from '@src/primitives/Button'
import PendingIndicator from '@src/primitives/PendingIndicator'

function AcceptEventInvitationRoute() {
  const { invitationToken } = useParams<{ invitationToken: string }>()
  const mutation = useAcceptEventInvitation()
  const attempted = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!invitationToken || attempted.current) return
    attempted.current = true
    mutation.mutate(invitationToken, {
      onSuccess: () => navigate('/events', { replace: true }),
    })
  }, [invitationToken, mutation, navigate])

  if (
    mutation.error instanceof InvitationUnavailableError ||
    !invitationToken
  ) {
    return (
      <section className="mx-auto max-w-xl py-12">
        <h1 className="font-display text-3xl font-bold text-text">
          Invitation unavailable
        </h1>
        <p className="mt-2 text-text-muted">
          This invitation has expired, has already been used, or is not valid.
        </p>
        <Button
          className="mt-5"
          onClick={() => navigate('/events', { replace: true })}
        >
          Go to events
        </Button>
      </section>
    )
  }
  if (mutation.isError) {
    return (
      <section className="mx-auto max-w-xl py-12" role="alert">
        <h1 className="font-display text-3xl font-bold text-text">
          Could not accept invitation
        </h1>
        <p className="mt-2 text-text-muted">
          Check your connection and try again.
        </p>
        <Button
          className="mt-5"
          variant="secondary"
          onClick={() => {
            attempted.current = false
          }}
        >
          Try again
        </Button>
      </section>
    )
  }
  return (
    <div
      className="flex min-h-48 items-center justify-center gap-3 py-12 text-text-muted"
      role="status"
    >
      <PendingIndicator />
      <span>Opening event invitation…</span>
    </div>
  )
}

export default AcceptEventInvitationRoute
