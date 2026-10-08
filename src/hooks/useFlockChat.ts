import {
  getFlockMessage,
  listFlockMessages,
  markFlockChatRead,
  sendFlockMessage,
} from '@src/data/flockChat'
import { flockChatQueryKeys } from '@src/data/queryKeys'
import { useChatMessages } from '@src/hooks/useChatMessages'

export function useFlockChat(flockId: string | undefined, enabled: boolean) {
  return useChatMessages({
    channelName: 'flock-chat',
    enabled,
    filterColumn: 'flock_id',
    getMessage: getFlockMessage,
    getQueryKey: flockChatQueryKeys.messages,
    id: flockId,
    listMessages: listFlockMessages,
    listQueryKey: flockChatQueryKeys.lists(),
    markRead: markFlockChatRead,
    sendMessage: sendFlockMessage,
    table: 'flock_messages',
  })
}
