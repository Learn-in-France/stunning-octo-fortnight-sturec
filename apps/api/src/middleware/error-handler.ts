import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'

import { AuthError } from '../integrations/firebase/index.js'

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error(error)

  // Auth errors
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    })
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, reply)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.status(400).send({
      error: 'Invalid data provided',
      code: 'PRISMA_VALIDATION_ERROR',
    })
  }

  // Fastify errors (validation, not found, etc.)
  const fastifyError = error as FastifyError
  if (fastifyError.statusCode) {
    return reply.status(fastifyError.statusCode).send({
      error: fastifyError.message,
      code: fastifyError.code || 'REQUEST_ERROR',
    })
  }

  // Unknown errors
  return reply.status(500).send({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, reply: FastifyReply) {
  switch (error.code) {
    case 'P2002': {
      const target = (error.meta?.target as string[])?.join(', ') || 'field'
      return reply.status(409).send({
        error: `A record with this ${target} already exists`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        details: { target },
      })
    }
    case 'P2025':
      return reply.status(404).send({
        error: 'Record not found',
        code: 'NOT_FOUND',
      })
    case 'P2003':
      return reply.status(400).send({
        error: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      })
    default:
      return reply.status(500).send({
        error: 'Database error',
        code: 'DATABASE_ERROR',
      })
  }
}
