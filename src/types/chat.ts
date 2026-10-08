export type FlockMessage = {
  body: string
  createdAt: string
  flockId: string
  id: string
  senderDisplayName: string
  senderId: string
}

export type FlockChatSummary = {
  id: string
  name: string
}

export type FlockMessageCursor = {
  createdAt: string
  id: string
}

export type FlockMessagePage = {
  messages: FlockMessage[]
  nextCursor: FlockMessageCursor | null
}

export type FlockChatConnectionStatus = 'connecting' | 'live' | 'paused'
