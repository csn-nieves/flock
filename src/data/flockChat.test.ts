import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getFlockMessage,
  listMyFlockChats,
  listFlockMessages,
  markFlockChatRead,
  sendFlockMessage,
} from './flockChat'

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))
vi.mock('./supabase', () => ({ supabase: mocks }))

function messageRow(sequence: number) {
  return {
    body: `Message ${sequence}`,
    created_at: `2026-10-07T12:${String(sequence).padStart(2, '0')}:00Z`,
    flock_id: 'flock-id',
    id: `message-${sequence}`,
    sender_display_name: 'Local Runner',
    sender_id: 'runner-id',
  }
}

describe('flock chat data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists only the current runner flock chat summaries returned by the server', async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          flock_id: 'flock-a',
          flock_name: 'Morning Runners',
          latest_message_body: 'flock-rich:v1:[["Meet at six",1]]',
          latest_message_created_at: '2026-10-08T12:00:00Z',
          latest_sender_display_name: 'Maya Chen',
          latest_sender_id: 'maya-id',
          unread_count: 3,
        },
        {
          flock_id: 'flock-b',
          flock_name: 'Trail Birds',
          latest_message_body: null,
          latest_message_created_at: null,
          latest_sender_display_name: null,
          latest_sender_id: null,
          unread_count: 0,
        },
      ],
      error: null,
    })

    await expect(listMyFlockChats()).resolves.toEqual([
      {
        id: 'flock-a',
        latestMessageAt: '2026-10-08T12:00:00Z',
        latestMessagePreview: 'Meet at six',
        latestSenderDisplayName: 'Maya Chen',
        latestSenderId: 'maya-id',
        name: 'Morning Runners',
        unreadCount: 3,
      },
      {
        id: 'flock-b',
        latestMessageAt: null,
        latestMessagePreview: null,
        latestSenderDisplayName: null,
        latestSenderId: null,
        name: 'Trail Birds',
        unreadCount: 0,
      },
    ])
    expect(mocks.rpc).toHaveBeenCalledWith('list_my_flock_chats')
  })

  it('advances the current runner flock read cursor through the protected function', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null })

    await expect(
      markFlockChatRead('flock-id', 'message-id'),
    ).resolves.toBeUndefined()
    expect(mocks.rpc).toHaveBeenCalledWith('mark_flock_chat_read', {
      target_flock_id: 'flock-id',
      target_message_id: 'message-id',
    })
  })

  it('loads a bounded cursor page and returns messages chronologically', async () => {
    const rows = Array.from({ length: 31 }, (_, index) =>
      messageRow(31 - index),
    )
    mocks.rpc.mockResolvedValue({ data: rows, error: null })

    const page = await listFlockMessages('flock-id', {
      createdAt: '2026-10-07T13:00:00Z',
      id: 'cursor-id',
    })

    expect(mocks.rpc).toHaveBeenCalledWith('list_flock_messages', {
      before_created_at: '2026-10-07T13:00:00Z',
      before_id: 'cursor-id',
      page_size: 31,
      target_flock_id: 'flock-id',
    })
    expect(page.messages).toHaveLength(30)
    expect(page.messages.at(0)?.id).toBe('message-2')
    expect(page.messages.at(-1)?.id).toBe('message-31')
    expect(page.nextCursor).toEqual({
      createdAt: messageRow(2).created_at,
      id: 'message-2',
    })
  })

  it('sends without a client-supplied sender and maps the returned message', async () => {
    mocks.rpc.mockResolvedValue({ data: [messageRow(1)], error: null })

    await expect(
      sendFlockMessage('flock-id', 'Meet at six'),
    ).resolves.toMatchObject({
      body: 'Message 1',
      senderDisplayName: 'Local Runner',
      senderId: 'runner-id',
    })
    expect(mocks.rpc).toHaveBeenCalledWith('send_flock_message', {
      message_body: 'Meet at six',
      target_flock_id: 'flock-id',
    })
  })

  it('hydrates a realtime insert with its sender display name', async () => {
    const query = { eq: vi.fn(), select: vi.fn(), single: vi.fn() }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.single.mockResolvedValue({
      data: {
        body: 'See you there',
        created_at: '2026-10-07T12:00:00Z',
        flock_id: 'flock-id',
        id: 'message-id',
        profiles: { display_name: 'Maya Chen' },
        sender_id: 'runner-id',
      },
      error: null,
    })
    mocks.from.mockReturnValue(query)

    await expect(getFlockMessage('message-id')).resolves.toMatchObject({
      body: 'See you there',
      senderDisplayName: 'Maya Chen',
    })
    expect(query.eq).toHaveBeenCalledWith('id', 'message-id')
  })
})
