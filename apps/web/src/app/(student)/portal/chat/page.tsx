'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import type { ChatMessageItem } from '@sturec/shared'
import {
  useChatSessions,
  useChatMessages,
  useStartSession,
  useSendMessage,
  useEndSession,
} from '@/features/chat/hooks/use-chat'

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageItem[]>([])
  const [options, setOptions] = useState<string[] | null>(null)
  const [showBookingPrompt, setShowBookingPrompt] = useState(false)
  const [showSessions, setShowSessions] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: sessions, isLoading: loadingSessions } = useChatSessions()
  const { data: serverMessages } = useChatMessages(activeSessionId)
  const startSession = useStartSession()
  const sendMessage = useSendMessage(activeSessionId)
  const endSession = useEndSession()

  // Auto-select active session on load
  useEffect(() => {
    if (!activeSessionId && sessions?.length) {
      const active = sessions.find((s) => s.status === 'active')
      if (active) setActiveSessionId(active.id)
    }
  }, [sessions, activeSessionId])

  // Merge server messages with optimistic
  const messages = serverMessages ?? []
  const allMessages = [
    ...messages,
    ...optimisticMessages.filter(
      (opt) => !messages.some((m) => m.id === opt.id),
    ),
  ]

  // Clear optimistic messages when server catches up
  useEffect(() => {
    if (serverMessages?.length && optimisticMessages.length) {
      setOptimisticMessages((prev) =>
        prev.filter((opt) => !serverMessages.some((m) => m.id === opt.id)),
      )
    }
  }, [serverMessages, optimisticMessages.length])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  const activeSession = sessions?.find((s) => s.id === activeSessionId)
  const isSessionActive = activeSession?.status === 'active'
  const isSending = sendMessage.isPending

  const handleStartSession = useCallback(async () => {
    const session = await startSession.mutateAsync()
    setActiveSessionId(session.id)
    setOptions(null)
    setShowBookingPrompt(false)
    setOptimisticMessages([])
  }, [startSession])

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() || !activeSessionId || isSending) return

    const trimmed = content.trim()
    setInput('')
    setOptions(null)

    // Optimistic user message
    const tempId = `temp-${Date.now()}`
    setOptimisticMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: trimmed, timestamp: new Date().toISOString() },
    ])

    try {
      const response = await sendMessage.mutateAsync(trimmed)
      // Remove the temp and add the real response
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId))
      if (response.options?.length) {
        setOptions(response.options)
      }
      setShowBookingPrompt(response.shouldSuggestBooking === true)
    } catch {
      // Remove failed optimistic message
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId))
    }

    inputRef.current?.focus()
  }, [activeSessionId, isSending, sendMessage])

  const handleEndSession = useCallback(async () => {
    if (!activeSessionId) return
    await endSession.mutateAsync(activeSessionId)
    setActiveSessionId(null)
    setOptions(null)
    setShowBookingPrompt(false)
    setOptimisticMessages([])
  }, [activeSessionId, endSession])

  const handleOptionClick = useCallback((option: string) => {
    handleSend(option)
  }, [handleSend])

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            AI Study Advisor
          </h1>
          <p className="text-sm text-text-muted">
            Personalized guidance on studying in France.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions && sessions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSessions(!showSessions)}
            >
              {showSessions ? 'Hide' : 'Sessions'} ({sessions.length})
            </Button>
          )}
          {isSessionActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEndSession}
              disabled={endSession.isPending}
            >
              {endSession.isPending ? 'Ending…' : 'End Session'}
            </Button>
          )}
          {!activeSessionId && (
            <Button
              size="sm"
              onClick={handleStartSession}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? 'Starting…' : 'New Conversation'}
            </Button>
          )}
        </div>
      </div>

      {/* Session selector */}
      {showSessions && sessions && sessions.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 shrink-0">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSessionId(s.id)
                setOptions(null)
                setShowBookingPrompt(false)
                setOptimisticMessages([])
                setShowSessions(false)
              }}
              className={`
                shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${s.id === activeSessionId
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-surface-raised border-border text-text-muted hover:bg-surface-sunken'
                }
              `}
            >
              {formatSessionDate(s.createdAt)}
              {s.status === 'active' && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main chat area */}
      {!activeSessionId ? (
        <div className="flex-1 flex items-center justify-center">
          <Card padding="none" className="max-w-md w-full">
            <EmptyState
              title="Start a conversation"
              description="Our AI advisor can help you understand studying in France, prepare for the process, and gather the context needed for a counsellor handoff. Your conversations are private."
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M6 6H34C35.657 6 37 7.343 37 9V27C37 28.657 35.657 30 34 30H13L6 37V9C6 7.343 7.343 6 9 6H34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M14 16H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M14 22H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
              action={{
                label: startSession.isPending ? 'Starting…' : 'Start Conversation',
                onClick: handleStartSession,
              }}
            />
          </Card>
        </div>
      ) : (
        <Card className="flex-1 flex flex-col min-h-0 !p-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {allMessages.length === 0 && !isSending && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-text-muted text-center">
                  Say hello to start the conversation.
                </p>
              </div>
            )}

            {allMessages
              .filter((m) => m.role !== 'system')
              .map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-700">AI</span>
                </div>
                <div className="bg-surface-sunken rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showBookingPrompt && isSessionActive && (
            <div className="mx-4 mb-2 rounded-2xl border border-primary-200 bg-primary-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Ready to speak with a counsellor?</p>
                  <p className="mt-1 text-xs leading-6 text-text-secondary">
                    You have shared enough context for a useful human handoff. You can book a counsellor session now or keep chatting if you want to refine your goals first.
                  </p>
                </div>
                <Link
                  href="/portal/bookings?source=chat"
                  className="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Book counsellor session
                </Link>
              </div>
            </div>
          )}

          {/* Interactive options */}
          {options && options.length > 0 && isSessionActive && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={isSending}
                  className="px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-4 shrink-0">
            {isSessionActive ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend(input)
                }}
                className="flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message…"
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                />
                <Button type="submit" disabled={!input.trim() || isSending}>
                  Send
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">This session has ended.</p>
                <Button
                  size="sm"
                  onClick={handleStartSession}
                  disabled={startSession.isPending}
                >
                  New Conversation
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Privacy notice */}
      <div className="mt-3 p-2.5 rounded-lg bg-surface-sunken/50 border border-border shrink-0">
        <p className="text-[11px] text-text-muted">
          <span className="font-semibold">Privacy:</span> Your conversations are private and not shared with counsellors. Only structured summaries are shared internally when a counsellor handoff is needed.
        </p>
      </div>
    </div>
  )
}

// ─── Message bubble ─────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessageItem }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-primary-100 text-primary-700'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-600 text-white rounded-tr-sm'
            : 'bg-surface-sunken text-text-primary rounded-tl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p
          className={`text-[10px] mt-1.5 ${
            isUser ? 'text-white/60' : 'text-text-muted'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
