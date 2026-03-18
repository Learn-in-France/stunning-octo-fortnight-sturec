import type { FastifyRequest, FastifyReply } from 'fastify'
import * as teamService from './service.js'

export async function listTeamMembers(request: FastifyRequest, reply: FastifyReply) {
  const members = await teamService.listTeamMembers()
  return reply.send(members)
}

export async function inviteTeamMember(request: FastifyRequest, reply: FastifyReply) {
  const member = await teamService.inviteTeamMember(request.body as any, request.user.id)
  return reply.status(201).send(member)
}

export async function updateTeamMember(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await teamService.updateTeamMember(request.params.id, request.body as any)
  if (!result) return reply.status(404).send({ error: 'Team member not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function listCounsellorAssignments(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const assignments = await teamService.getCounsellorAssignments(request.params.id)
  return reply.send(assignments)
}
