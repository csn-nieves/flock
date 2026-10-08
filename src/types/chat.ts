export type ChatMessage = {
  body: string
  createdAt: string
  id: string
  senderDisplayName: string
  senderId: string
}

export type FlockMessage = ChatMessage & {
  flockId: string
}

export type DirectMessage = ChatMessage & {
  conversationId: string
}

export type FlockChatSummary = {
  id: string
  name: string
}

export type DirectConversationSummary = {
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
