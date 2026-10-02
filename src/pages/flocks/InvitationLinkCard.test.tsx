import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import InvitationLinkCard from './InvitationLinkCard'

describe('InvitationLinkCard', () => {
  it('explains a seven-day universal flock link', () => {
    render(
      <InvitationLinkCard
        expiresInLabel="7 days"
        invitationUrl="https://example.test/event"
        linkScope="flock"
        recipientName="Harbor Long Run"
        onCopy={vi.fn()}
      />,
    )

    expect(
      screen.getByText(
        'Any current member of Harbor Long Run can use this link.',
      ),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Each eligible flock member can accept once. This link expires 7 days after creation.',
      ),
    ).toBeVisible()
  })

  it('copies an invitation link and reports success', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined)
    render(
      <InvitationLinkCard
        invitationUrl="https://example.test/event"
        onCopy={onCopy}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy invitation link' }),
    )
    await waitFor(() =>
      expect(onCopy).toHaveBeenCalledWith('https://example.test/event'),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Invitation link copied.',
    )
  })

  it('shares when a share callback is available', async () => {
    const onShare = vi.fn().mockResolvedValue('shared' as const)
    render(
      <InvitationLinkCard
        invitationUrl="https://example.test/event"
        onCopy={vi.fn()}
        onShare={onShare}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Share invitation' }))
    await waitFor(() =>
      expect(onShare).toHaveBeenCalledWith('https://example.test/event'),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Invitation shared.')
  })
})
