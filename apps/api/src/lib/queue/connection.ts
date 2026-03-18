/**
 * BullMQ connection factory.
 *
 * Shared Redis connection for all queues and workers.
 * Reads REDIS_URL from environment, falls back to localhost.
 */

import type { ConnectionOptions } from 'bullmq'

function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
    password: parsed.password || undefined,
    ...(parsed.protocol === 'rediss:' && { tls: {} }),
  }
}

let connectionOptions: ConnectionOptions | undefined

export function getRedisConnection(): ConnectionOptions {
  if (connectionOptions) return connectionOptions

  const url = process.env.REDIS_URL
  if (url) {
    connectionOptions = parseRedisUrl(url)
  } else {
    connectionOptions = { host: '127.0.0.1', port: 6379 }
  }

  return connectionOptions
}
