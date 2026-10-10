import type { MessageReaction, MessageReactionKey } from '@src/types/chat'
import type { Database } from '@src/types/database'
import { supabase } from './supabase'

export const messageReactionKeys: readonly MessageReactionKey[] = [
  'thumbs_up',
  'heart',
  'laugh',
  'celebrate',
  'fire',
  'eyes',
]

type ReactionRow = Database['public']['Tables']['chat_message_reactions']['Row']

async function getCurrentUserId() {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id ?? null
  } catch {
    return null
  }
}

async function loadReactionRows(
  sourceColumn: 'flock_message_id' | 'direct_message_id',
  messageIds: readonly string[],
) {
  if (messageIds.length === 0) return []
  const query = supabase.from('chat_message_reactions')
  if (!query || typeof query.select !== 'function') return []
  const selectedQuery = query.select(
    'created_at, direct_message_id, flock_message_id, id, reaction_key, user_id',
  )
  if (!selectedQuery || typeof selectedQuery.in !== 'function') return []
  const { data, error } = await selectedQuery.in(sourceColumn, [...messageIds])
  if (error) throw error
  return data as ReactionRow[]
}

export async function loadMessageReactions(
  sourceColumn: 'flock_message_id' | 'direct_message_id',
  messageIds: readonly string[],
): Promise<Map<string, MessageReaction[]>> {
  const [rows, userId] = await Promise.all([
    loadReactionRows(sourceColumn, messageIds),
    getCurrentUserId(),
  ])
  const grouped = new Map<string, Map<MessageReactionKey, MessageReaction>>()

  for (const row of rows) {
    const messageId =
      sourceColumn === 'flock_message_id'
        ? row.flock_message_id
        : row.direct_message_id
    if (!messageId) continue
    const key = row.reaction_key as MessageReactionKey
    const messageReactions = grouped.get(messageId) ?? new Map()
    const current = messageReactions.get(key) ?? {
      count: 0,
      isSelected: false,
      key,
    }
    current.count += 1
    current.isSelected ||= row.user_id === userId
    messageReactions.set(key, current)
    grouped.set(messageId, messageReactions)
  }

  return new Map(
    [...grouped.entries()].map(([messageId, reactions]) => [
      messageId,
      [...reactions.values()],
    ]),
  )
}

export async function toggleFlockMessageReaction(
  messageId: string,
  reactionKey: MessageReactionKey,
) {
  const { data, error } = await supabase.rpc('toggle_flock_message_reaction', {
    target_message_id: messageId,
    target_reaction_key: reactionKey,
  })
  if (error) throw error
  return data
}

export async function toggleDirectMessageReaction(
  messageId: string,
  reactionKey: MessageReactionKey,
) {
  const { data, error } = await supabase.rpc('toggle_direct_message_reaction', {
    target_message_id: messageId,
    target_reaction_key: reactionKey,
  })
  if (error) throw error
  return data
}
