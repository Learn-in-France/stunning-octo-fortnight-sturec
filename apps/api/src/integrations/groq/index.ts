/**
 * Groq integration — direct API calls, no LangGraph.
 *
 * Uses llama-3.3-70b-versatile for chat completions with structured JSON
 * output for AI assessments.
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqCompletionResult {
  content: string
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

/**
 * Liveness ping for the ops /integrations endpoint. Hits Groq's
 * /models endpoint — a cheap authenticated GET that proves the API
 * key works. Returns a graceful error object rather than throwing.
 */
export async function pingGroq(): Promise<{
  ok: boolean
  latencyMs: number
  error?: string
}> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { ok: false, latencyMs: 0, error: 'GROQ_API_KEY not set' }
  }
  const start = Date.now()
  try {
    const response = await fetch(GROQ_MODELS_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    return {
      ok: response.ok,
      latencyMs: Date.now() - start,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

export async function chatCompletion(
  messages: GroqMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<GroqCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not set')

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      ...(options?.jsonMode && { response_format: { type: 'json_object' } }),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Groq API error ${response.status}: ${body}`)
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  }

  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  }
}
