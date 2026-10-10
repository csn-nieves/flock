import {
  getDirectMessage,
  listDirectMessages,
  markDirectConversationRead,
  sendDirectMessage,
} from '@src/data/directChat'
import { toggleDirectMessageReaction } from '@src/data/chatReactions'
import { directChatQueryKeys } from '@src/data/queryKeys'
import { useChatMessages } from '@src/hooks/useChatMessages'

export function useDirectChat(
  conversationId: string | undefined,
  enabled: boolean,
) {
  return useChatMessages({
    channelName: 'direct-chat',
    enabled,
    filterColumn: 'conversation_id',
    getMessage: getDirectMessage,
    getQueryKey: directChatQueryKeys.messages,
    id: conversationId,
    listMessages: listDirectMessages,
    listQueryKey: directChatQueryKeys.lists(),
    markRead: markDirectConversationRead,
    reactionFilterColumn: 'direct_message_id',
    sendMessage: sendDirectMessage,
    table: 'direct_messages',
    toggleReaction: toggleDirectMessageReaction,
  })
}
