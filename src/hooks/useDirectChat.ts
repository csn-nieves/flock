import {
  getDirectMessage,
  listDirectMessages,
  sendDirectMessage,
} from '@src/data/directChat'
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
    sendMessage: sendDirectMessage,
    table: 'direct_messages',
  })
}
