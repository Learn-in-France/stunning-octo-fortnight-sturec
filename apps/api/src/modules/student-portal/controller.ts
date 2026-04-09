import type { FastifyRequest, FastifyReply } from 'fastify'
import * as portalService from './service.js'

function sendEmailVerificationGate(reply: FastifyReply) {
  return reply.code(403).send({
    error: 'Please verify your email before sharing documents with your counsellor',
    code: 'EMAIL_NOT_VERIFIED',
  })
}

export async function getOwnProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getOwnProfile(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function updateOwnProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.updateOwnProfile(request.user.id, request.body as Record<string, unknown>)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function completeOnboarding(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    firstName: string
    lastName: string
    countryDialCode: string
    phoneLocal: string
    whatsappConsent: boolean
  }
  const result = await portalService.completeOnboarding(request.user.id, body)
  if (!result.ok) {
    if (result.reason === 'student_not_found') {
      return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
    }
    return reply.code(400).send({
      error: 'Phone number could not be normalized to a valid international format',
      code: 'INVALID_PHONE',
    })
  }
  return reply.send(result.profile)
}

export async function getProgress(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getProgress(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function getApplications(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getApplications(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function getApplicationDetail(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await portalService.getApplicationDetail(request.user.id, request.params.id)
  if (!result) return reply.code(404).send({ error: 'Application not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function getDocuments(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getDocuments(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function requestDocumentUploadUrl(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.requestDocumentUploadUrl(request.user.id, request.body as any)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.code(201).send(result)
}

export async function completeDocumentUpload(request: FastifyRequest, reply: FastifyReply) {
  const { documentId } = request.body as { documentId: string }
  const result = await portalService.completeDocumentUpload(request.user.id, documentId)
  if (!result) return reply.code(404).send({ error: 'Document not found or invalid state', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function shareDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  if (!request.user.emailVerified) return sendEmailVerificationGate(reply)
  const result = await portalService.shareDocument(request.user.id, request.params.id)
  if (!result) return reply.code(404).send({ error: 'Document not found or cannot be shared', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function revokeDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  if (!request.user.emailVerified) return sendEmailVerificationGate(reply)
  const result = await portalService.revokeDocument(request.user.id, request.params.id)
  if (!result) return reply.code(404).send({ error: 'Document not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function getRequirements(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getRequirements(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function getBookings(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getBookings(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function getNotifications(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getNotifications(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function getNotificationPreferences(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.getNotificationPreferences(request.user.id)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function updateNotificationPreferences(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.updateNotificationPreferences(request.user.id, request.body as any)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function submitSupport(request: FastifyRequest, reply: FastifyReply) {
  const result = await portalService.submitSupportRequest(request.user.id, request.body as any)
  if (!result) return reply.code(404).send({ error: 'Student profile not found', code: 'STUDENT_NOT_FOUND' })
  return reply.code(201).send(result)
}
