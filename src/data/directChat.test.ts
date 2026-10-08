import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getDirectMessage,
  getOrCreateDirectConversation,
  listDirectMessages,
  listMyDirectConversations,
  sendDirectMessage,
} from './directChat'

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))
vi.mock('./supabase', () => ({ supabase: mocks }))

function messageRow(sequence: number) {
  return {
    body: `Private message ${sequence}`,
    conversation_id: 'conversation-id',
    created_at: `2026-10-08T12:${String(sequence).padStart(2, '0')}:00Z`,
    id: `message-${sequence}`,
    sender_display_name: 'Maya Chen',
    sender_id: 'maya-id',
  }
}

describe('direct chat data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps the current runner private conversation summaries', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          conversation_id: 'conversation-id',
          other_display_name: 'Maya Chen',
          other_user_id: 'maya-id',
        },
      ],
      error: null,
    })

    await expect(listMyDirectConversations()).resolves.toEqual([
      {
        id: 'conversation-id',
        otherDisplayName: 'Maya Chen',
        otherUserId: 'maya-id',
      },
    ])
    expect(mocks.rpc).toHaveBeenCalledWith('list_my_direct_conversations')
  })

  it('gets or creates the canonical conversation without a client owner id', async () => {
    mocks.rpc.mockResolvedValue({ data: 'conversation-id', error: null })

    await expect(getOrCreateDirectConversation('maya-id')).resolves.toBe(
      'conversation-id',
    )
    expect(mocks.rpc).toHaveBeenCalledWith(
      'get_or_create_direct_conversation',
      { target_user_id: 'maya-id' },
    )
  })

  it('loads a bounded cursor page in chronological order', async () => {
    const rows = Array.from({ length: 31 }, (_, index) =>
      messageRow(31 - index),
    )
    mocks.rpc.mockResolvedValue({ data: rows, error: null })

    const page = await listDirectMessages('conversation-id', {
      createdAt: '2026-10-08T13:00:00Z',
      id: 'cursor-id',
    })

    expect(mocks.rpc).toHaveBeenCalledWith('list_direct_messages', {
      before_created_at: '2026-10-08T13:00:00Z',
      before_id: 'cursor-id',
      page_size: 31,
      target_conversation_id: 'conversation-id',
    })
    expect(page.messages).toHaveLength(30)
    expect(page.messages.at(0)?.id).toBe('message-2')
    expect(page.messages.at(-1)?.id).toBe('message-31')
    expect(page.nextCursor).toEqual({
      createdAt: messageRow(2).created_at,
      id: 'message-2',
    })
  })

  it('sends without a client-supplied sender', async () => {
    mocks.rpc.mockResolvedValue({ data: [messageRow(1)], error: null })

    await expect(
      sendDirectMessage('conversation-id', 'See you at six'),
    ).resolves.toMatchObject({
      body: 'Private message 1',
      conversationId: 'conversation-id',
      senderId: 'maya-id',
    })
    expect(mocks.rpc).toHaveBeenCalledWith('send_direct_message', {
      message_body: 'See you at six',
      target_conversation_id: 'conversation-id',
    })
  })

  it('hydrates a realtime insert with the sender display name', async () => {
    const query = { eq: vi.fn(), select: vi.fn(), single: vi.fn() }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.single.mockResolvedValue({
      data: {
        body: 'On my way',
        conversation_id: 'conversation-id',
        created_at: '2026-10-08T12:00:00Z',
        id: 'message-id',
        profiles: { display_name: 'Maya Chen' },
        sender_id: 'maya-id',
      },
      error: null,
    })
    mocks.from.mockReturnValue(query)

    await expect(getDirectMessage('message-id')).resolves.toMatchObject({
      body: 'On my way',
      senderDisplayName: 'Maya Chen',
    })
    expect(query.eq).toHaveBeenCalledWith('id', 'message-id')
  })
})
