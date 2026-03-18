/**
 * Worker idempotency layer.
 *
 * Uses a Redis SET with TTL to track processed jobs. Workers check before
 * executing and mark as processed on success. This prevents duplicate
 * side effects on retry or duplicate event delivery.
 *
 * Key strategy per queue is defined in docs/architecture/06-queues-and-workers.md
 */

import { Redis } from 'ioredis'
import { getRedisConnection } from './connection.js'

const PROCESSED_SET_PREFIX = 'processed_jobs'
const DEFAULT_TTL_SECONDS = 86400 // 24 hours

let _redis: Redis | null = null

function getRedis(): Redis {
  if (_redis) return _redis
  const opts = getRedisConnection() as Record<string, any>
  _redis = new Redis({
    host: opts.host || '127.0.0.1',
    port: opts.port || 6379,
    password: opts.password,
    ...(opts.tls ? { tls: {} } : {}),
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  })
  return _redis
}

/**
 * Build a stable idempotency key for a job.
 */
export function buildIdempotencyKey(queue: string, parts: string[]): string {
  return `${PROCESSED_SET_PREFIX}:${queue}:${parts.join(':')}`
}

/**
 * Check if a job has already been processed.
 * Returns true if already processed (should skip).
 */
export async function isAlreadyProcessed(key: string): Promise<boolean> {
  const redis = getRedis()
  const exists = await redis.exists(key)
  return exists === 1
}

/**
 * Mark a job as processed with TTL.
 */
export async function markProcessed(
  key: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const redis = getRedis()
  await redis.set(key, '1', 'EX', ttlSeconds)
}

/**
 * Combined check-and-execute pattern.
 * Returns the result of the handler if not already processed, or null if skipped.
 */
export async function withIdempotency<T>(
  key: string,
  handler: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<{ result: T; skipped: false } | { result: null; skipped: true }> {
  if (await isAlreadyProcessed(key)) {
    return { result: null, skipped: true }
  }

  const result = await handler()
  await markProcessed(key, ttlSeconds)
  return { result, skipped: false }
}

/**
 * Gracefully close the Redis connection.
 */
export async function closeIdempotencyRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit()
    _redis = null
  }
}
