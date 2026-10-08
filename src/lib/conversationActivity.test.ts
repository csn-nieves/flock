import { describe, expect, it } from 'vitest'

import {
  formatConversationActivityTime,
  getConversationAccessibleLabel,
  getConversationPreview,
} from './conversationActivity'

const activity = {
  latestMessageAt: '2026-10-08T14:12:00Z',
  latestMessagePreview: 'Meet\n  at the trailhead.',
  latestSenderDisplayName: 'Maya Chen',
  latestSenderId: 'maya-id',
  unreadCount: 3,
}

describe('conversation activity presentation', () => {
  it('normalizes previews and identifies the current runner', () => {
    expect(getConversationPreview(activity, 'runner-id')).toBe(
      'Maya Chen: Meet at the trailhead.',
    )
    expect(
      getConversationPreview(
        { ...activity, latestSenderId: 'runner-id' },
        'runner-id',
      ),
    ).toBe('You: Meet at the trailhead.')
  })

  it('keeps the full unread count in the accessible label', () => {
    expect(
      getConversationAccessibleLabel('Morning Runners', activity, 'runner-id'),
    ).toMatch(/^Morning Runners, 3 unread messages, Maya Chen:/)
  })

  it('formats same-day activity as a compact local time', () => {
    const time = formatConversationActivityTime(
      '2026-10-08T14:12:00Z',
      new Date('2026-10-08T18:00:00Z'),
    )

    expect(time).not.toContain('2026')
    expect(time).toMatch(/\d/)
  })
})
