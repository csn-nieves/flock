export type ChatMessage = {
  body: string
  createdAt: string
  id: string
  reactions?: MessageReaction[]
  senderDisplayName: string
  senderId: string
}

export type MessageReaction = {
  count: number
  isSelected: boolean
  key: MessageReactionKey
}

export type MessageReactionKey =
  'thumbs_up' | 'heart' | 'laugh' | 'celebrate' | 'fire' | 'eyes'

export type FlockMessage = ChatMessage & {
  flockId: string
}

export type DirectMessage = ChatMessage & {
  conversationId: string
}

export type ConversationActivity = {
  latestMessageAt: string | null
  latestMessagePreview: string | null
  latestSenderDisplayName: string | null
  latestSenderId: string | null
  unreadCount: number
}

export type FlockChatSummary = ConversationActivity & {
  id: string
  name: string
}

export type DirectConversationSummary = ConversationActivity & {
  id: string
  otherDisplayName: string
  otherUserId: string
}

export type ChatMessageCursor = {
  createdAt: string
  id: string
}

export type ChatMessagePage<Message extends ChatMessage = ChatMessage> = {
  messages: Message[]
  nextCursor: ChatMessageCursor | null
}

export type ChatConnectionStatus = 'connecting' | 'live' | 'paused'

export type FlockMessageCursor = ChatMessageCursor
export type FlockMessagePage = ChatMessagePage<FlockMessage>
export type FlockChatConnectionStatus = ChatConnectionStatus
