import { useRef, useState, type ReactNode } from 'react'

import Button from '@src/primitives/Button'
import TextField from '@src/primitives/TextField'

type CopyStatus = 'idle' | 'copying' | 'copied' | 'error'

export type InvitationLinkCardProps = {
  invitationUrl: string
  onCopy: (invitationUrl: string) => Promise<void>
}

function InvitationLinkCard({
  invitationUrl,
  onCopy,
}: InvitationLinkCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const isCopying = copyStatus === 'copying'
  let hint: ReactNode =
    'This link works once and expires 24 hours after creation.'

  if (copyStatus === 'copied') {
    hint = <span role="status">Invitation link copied.</span>
  } else if (copyStatus === 'error') {
    hint = (
      <span role="alert">
        We could not copy the link. Select it and copy it manually.
      </span>
    )
  }

  async function handleCopy() {
    if (isCopying) {
      return
    }

    setCopyStatus('copying')

    try {
      await onCopy(invitationUrl)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-subtle px-4 py-5">
      <h2 className="mt-0 mb-1 font-display text-xl font-bold text-text">
        Invitation ready
      </h2>
      <p className="mt-0 mb-5 leading-6 text-text-muted">
        Send this link to the runner you want to join.
      </p>

      <TextField
        hint={hint}
        label="Invitation link"
        name="invitationLink"
        readOnly
        ref={inputRef}
        type="url"
        value={invitationUrl}
      />

      <Button
        className="mt-4 w-full"
        isPending={isCopying}
        pendingLabel="Copying link"
        onClick={() => void handleCopy()}
      >
        Copy invitation link
      </Button>
    </div>
  )
}

export default InvitationLinkCard
