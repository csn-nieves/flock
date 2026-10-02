import { useRef, useState, type ReactNode } from 'react'

import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

export type ShareInvitationResult = 'shared' | 'cancelled'

type InvitationActionStatus =
  | 'idle'
  | 'sharing'
  | 'shared'
  | 'share-error'
  | 'copying'
  | 'copied'
  | 'copy-error'

export type InvitationLinkCardProps = {
  invitationUrl: string
  onCopy: (invitationUrl: string) => Promise<void>
  expiresInLabel?: string
  linkScope?: 'flock' | 'single-use'
  recipientName?: string
  onShare?: (invitationUrl: string) => Promise<ShareInvitationResult>
}

function InvitationLinkCard({
  invitationUrl,
  expiresInLabel = '24 hours',
  linkScope = 'single-use',
  recipientName,
  onCopy,
  onShare,
}: InvitationLinkCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [actionStatus, setActionStatus] =
    useState<InvitationActionStatus>('idle')
  const isCopying = actionStatus === 'copying'
  const isSharing = actionStatus === 'sharing'
  const isBusy = isCopying || isSharing
  let description = 'Send this link to the runner you want to join.'
  let hint: ReactNode =
    linkScope === 'flock'
      ? `Each eligible flock member can accept once. This link expires ${expiresInLabel} after creation.`
      : `This link works once and expires ${expiresInLabel} after creation.`

  if (linkScope === 'flock' && recipientName) {
    description = `Any current member of ${recipientName} can use this link.`
  } else if (recipientName) {
    description = `This link can only be used by ${recipientName}.`
  }

  if (actionStatus === 'shared') {
    hint = <span role="status">Invitation shared.</span>
  } else if (actionStatus === 'share-error') {
    hint = (
      <span role="alert">
        We could not open sharing options. Copy the link instead.
      </span>
    )
  } else if (actionStatus === 'copied') {
    hint = <span role="status">Invitation link copied.</span>
  } else if (actionStatus === 'copy-error') {
    hint = (
      <span role="alert">
        We could not copy the link. Select it and copy it manually.
      </span>
    )
  }

  async function handleShare() {
    if (!onShare || isBusy) {
      return
    }

    setActionStatus('sharing')

    try {
      const result = await onShare(invitationUrl)
      setActionStatus(result === 'shared' ? 'shared' : 'idle')
    } catch {
      setActionStatus('share-error')
    }
  }

  async function handleCopy() {
    if (isBusy) {
      return
    }

    setActionStatus('copying')

    try {
      await onCopy(invitationUrl)
      setActionStatus('copied')
    } catch {
      setActionStatus('copy-error')
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-subtle px-4 py-5">
      <h2 className="mt-0 mb-1 font-display text-xl font-bold text-text">
        Invitation ready
      </h2>
      <p className="mt-0 mb-5 leading-6 text-text-muted">{description}</p>

      <TextField
        hint={hint}
        label="Invitation link"
        name="invitationLink"
        readOnly
        ref={inputRef}
        type="url"
        value={invitationUrl}
      />

      <div className="mt-4 grid gap-3">
        {onShare ? (
          <Button
            isPending={isSharing}
            pendingLabel="Opening sharing options"
            onClick={() => void handleShare()}
          >
            Share invitation
          </Button>
        ) : null}

        <Button
          disabled={isSharing}
          isPending={isCopying}
          pendingLabel="Copying link"
          variant={onShare ? 'secondary' : 'primary'}
          onClick={() => void handleCopy()}
        >
          Copy invitation link
        </Button>
      </div>
    </div>
  )
}

export default InvitationLinkCard
