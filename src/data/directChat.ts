import { supabase } from './supabase'
import type {
  ChatMessageCursor,
  ChatMessagePage,
  DirectConversationSummary,
  DirectMessage,
} from '@src/types/chat'
import type { Database } from '@src/types/database'

const messagePageSize = 30

type DirectMessageRow =
  Database['public']['Functions']['list_direct_messages']['Returns'][number]

function toDirectMessage(row: DirectMessageRow): DirectMessage {
  return {
    body: row.body,
    conversationId: row.conversation_id,
    createdAt: row.created_at,
    id: row.id,
    senderDisplayName: row.sender_display_name,
    senderId: row.sender_id,
  }
}

export async function listMyDirectConversations(): Promise<
  DirectConversationSummary[]
> {
  const { data, error } = await supabase.rpc('list_my_direct_conversations')
  if (error) throw error

  return data.map((conversation) => ({
    id: conversation.conversation_id,
    otherDisplayName: conversation.other_display_name,
    otherUserId: conversation.other_user_id,
  }))
}

export async function getOrCreateDirectConversation(targetUserId: string) {
  const { data, error } = await supabase.rpc(
    'get_or_create_direct_conversation',
    { target_user_id: targetUserId },
  )
  if (error) throw error
  return data
}

export async function listDirectMessages(
  conversationId: string,
  cursor: ChatMessageCursor | null,
): Promise<ChatMessagePage<DirectMessage>> {
  const { data, error } = await supabase.rpc('list_direct_messages', {
    before_created_at: cursor?.createdAt,
    before_id: cursor?.id,
    page_size: messagePageSize + 1,
    target_conversation_id: conversationId,
  })
  if (error) throw error

  const currentRows = data.slice(0, messagePageSize)
  const oldestRow = currentRows.at(-1)

  return {
    messages: currentRows.map(toDirectMessage).reverse(),
    nextCursor:
      data.length > messagePageSize && oldestRow
        ? { createdAt: oldestRow.created_at, id: oldestRow.id }
        : null,
  }
}

export async function sendDirectMessage(
  conversationId: string,
  body: string,
): Promise<DirectMessage> {
  const { data, error } = await supabase.rpc('send_direct_message', {
    message_body: body,
    target_conversation_id: conversationId,
  })
  if (error) throw error

  const message = data.at(0)
  if (!message) throw new Error('The message could not be returned.')
  return toDirectMessage(message)
}

export async function getDirectMessage(
  messageId: string,
): Promise<DirectMessage> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select(
      'body, conversation_id, created_at, id, sender_id, profiles!direct_messages_sender_id_fkey(display_name)',
    )
    .eq('id', messageId)
    .single()
  if (error) throw error

  return {
    body: data.body,
    conversationId: data.conversation_id,
    createdAt: data.created_at,
    id: data.id,
    senderDisplayName: data.profiles.display_name,
    senderId: data.sender_id,
  }
}
