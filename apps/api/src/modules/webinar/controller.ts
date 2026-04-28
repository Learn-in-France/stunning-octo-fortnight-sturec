import type { FastifyRequest, FastifyReply } from 'fastify'

import * as service from './service.js'
import type { RsvpInput } from './schema.js'

export async function recordRsvp(request: FastifyRequest, reply: FastifyReply) {
  const result = await service.recordRsvp(request.body as RsvpInput)
  return reply.code(result.status === 'created' ? 201 : 200).send({
    status: result.status,
    leadId: result.leadId,
  })
}
