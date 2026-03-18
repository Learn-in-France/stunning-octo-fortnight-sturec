import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodSchema } from 'zod'

export function validateBody(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }
    request.body = result.data
  }
}

export function validateQuery(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.query)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }
    ;(request as FastifyRequest & { parsedQuery: unknown }).parsedQuery = result.data
  }
}

export function validateParams(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.params)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Invalid route parameters',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      })
    }
    request.params = result.data as typeof request.params
  }
}
