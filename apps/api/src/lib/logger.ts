import type { FastifyBaseLogger } from 'fastify'

export function getLoggerConfig(): { logger: boolean | Record<string, unknown> } {
  const isDev = process.env.NODE_ENV !== 'production'

  return {
    logger: isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true },
          },
        }
      : true,
  }
}

export function createRequestLogger(log: FastifyBaseLogger) {
  return {
    logRequest(method: string, url: string, statusCode: number, duration: number) {
      log.info({ method, url, statusCode, duration: `${duration}ms` }, 'request completed')
    },
  }
}
