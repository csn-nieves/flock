import { supabase } from './supabase'
import type {
  FlockChatSummary,
  FlockMessage,
  FlockMessageCursor,
  FlockMessagePage,
} from '@src/types/chat'
import type { Database } from '@src/types/database'
import { getPlainTextMessage } from '@src/lib/richTextMessage'

const messagePageSize = 30

type FlockMessageRow =
  Database['public']['Functions']['list_flock_messages']['Returns'][number]

export async function listMyFlockChats(): Promise<FlockChatSummary[]> {
  const { data, error } = await supabase.rpc('list_my_flock_chats')
  if (error) throw error

  return data.map((flock) => ({
    id: flock.flock_id,
    latestMessageAt: flock.latest_message_created_at,
    latestMessagePreview: flock.latest_message_body
      ? getPlainTextMessage(flock.latest_message_body)
      : null,
    latestSenderDisplayName: flock.latest_sender_display_name,
    latestSenderId: flock.latest_sender_id,
    name: flock.flock_name,
    unreadCount: flock.unread_count,
  }))
}

export async function markFlockChatRead(flockId: string, messageId: string) {
  const { error } = await supabase.rpc('mark_flock_chat_read', {
    target_flock_id: flockId,
    target_message_id: messageId,
  })
  if (error) throw error
}

function toFlockMessage(row: FlockMessageRow): FlockMessage {
  return {
    body: row.body,
    createdAt: row.created_at,
    flockId: row.flock_id,
    id: row.id,
    senderDisplayName: row.sender_display_name,
    senderId: row.sender_id,
  }
}

export async function listFlockMessages(
  flockId: string,
  cursor: FlockMessageCursor | null,
): Promise<FlockMessagePage> {
  const { data, error } = await supabase.rpc('list_flock_messages', {
    before_created_at: cursor?.createdAt,
    before_id: cursor?.id,
    page_size: messagePageSize + 1,
    target_flock_id: flockId,
  })
  if (error) throw error

  const currentRows = data.slice(0, messagePageSize)
  const oldestRow = currentRows.at(-1)

  return {
    messages: currentRows.map(toFlockMessage).reverse(),
    nextCursor:
      data.length > messagePageSize && oldestRow
        ? { createdAt: oldestRow.created_at, id: oldestRow.id }
        : null,
  }
}

export async function sendFlockMessage(
  flockId: string,
  body: string,
): Promise<FlockMessage> {
  const { data, error } = await supabase.rpc('send_flock_message', {
    message_body: body,
    target_flock_id: flockId,
  })
  if (error) throw error

  const message = data.at(0)
  if (!message) throw new Error('The message could not be returned.')
  return toFlockMessage(message)
}

export async function getFlockMessage(
  messageId: string,
): Promise<FlockMessage> {
  const { data, error } = await supabase
    .from('flock_messages')
    .select(
      'body, created_at, flock_id, id, sender_id, profiles!flock_messages_sender_id_fkey(display_name)',
    )
    .eq('id', messageId)
    .single()
  if (error) throw error

  return {
    body: data.body,
    createdAt: data.created_at,
    flockId: data.flock_id,
    id: data.id,
    senderDisplayName: data.profiles.display_name,
    senderId: data.sender_id,
  }
}
