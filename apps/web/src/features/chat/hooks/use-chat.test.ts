import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import api from '@/lib/api/client'
import {
  useChatSessions,
  useChatMessages,
  useStartSession,
  useSendMessage,
  useEndSession,
} from './use-chat'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useChatSessions', () => {
  it('fetches chat sessions', async () => {
    const sessions = [
      { id: 'sess-1', status: 'active', createdAt: '2025-01-01', lastMessageAt: '2025-01-01' },
    ]
    vi.mocked(api.get).mockResolvedValueOnce(sessions)

    const { result } = renderHook(() => useChatSessions(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(api.get).toHaveBeenCalledWith('/chat/sessions')
  })
})

describe('useChatMessages', () => {
  it('fetches messages for a session', async () => {
    const messages = [
      { id: 'msg-1', role: 'user', content: 'Hello', createdAt: '2025-01-01', options: null },
      { id: 'msg-2', role: 'assistant', content: 'Hi there!', createdAt: '2025-01-01', options: ['Tell me more'] },
    ]
    vi.mocked(api.get).mockResolvedValueOnce(messages)

    const { result } = renderHook(() => useChatMessages('sess-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(api.get).toHaveBeenCalledWith('/chat/sessions/sess-1/messages')
  })

  it('does not fetch when sessionId is null', () => {
    renderHook(() => useChatMessages(null), { wrapper })
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useStartSession', () => {
  it('creates a new session via POST', async () => {
    const newSession = { id: 'sess-new', status: 'active', createdAt: '2025-01-02', lastMessageAt: null }
    vi.mocked(api.post).mockResolvedValueOnce(newSession)

    const { result } = renderHook(() => useStartSession(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(api.post).toHaveBeenCalledWith('/chat/sessions')
  })
})

describe('useSendMessage', () => {
  it('sends a message to the session', async () => {
    const response = {
      userMessage: { id: 'msg-3', role: 'user', content: 'Test', createdAt: '2025-01-02' },
      aiMessage: { id: 'msg-4', role: 'assistant', content: 'Response', createdAt: '2025-01-02', options: [] },
    }
    vi.mocked(api.post).mockResolvedValueOnce(response)

    const { result } = renderHook(() => useSendMessage('sess-1'), { wrapper })

    await act(async () => {
      const res = await result.current.mutateAsync('Test')
      expect(res).toEqual(response)
    })

    expect(api.post).toHaveBeenCalledWith('/chat/sessions/sess-1/messages', { content: 'Test' })
  })
})

describe('useEndSession', () => {
  it('ends a session via POST', async () => {
    const ended = { id: 'sess-1', status: 'ended', createdAt: '2025-01-01', lastMessageAt: '2025-01-02' }
    vi.mocked(api.post).mockResolvedValueOnce(ended)

    const { result } = renderHook(() => useEndSession(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('sess-1')
    })

    expect(api.post).toHaveBeenCalledWith('/chat/sessions/sess-1/end')
  })
})
