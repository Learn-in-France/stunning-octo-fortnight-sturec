export type ChatSessionStatus = 'active' | 'completed'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatSession {
  id: string
  userId: string
  leadId: string
  studentId: string | null
  startedAt: string
  endedAt: string | null
  status: ChatSessionStatus
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  timestamp: string
}
