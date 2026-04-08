import type { FastifyRequest, FastifyReply } from 'fastify'
import * as documentService from './service.js'

export async function listDocuments(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const studentId = request.params.id

  // Counsellors only see shared (non-revoked) documents
  if (request.user.role === 'counsellor') {
    const docs = await documentService.listSharedDocuments(studentId, request.user.id)
    return reply.send(docs)
  }

  // Admin sees all documents with share state visible
  const docs = await documentService.listAllDocumentsForAdmin(studentId)
  return reply.send(docs)
}

export async function requestUploadUrl(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await documentService.requestUploadUrl(
    request.params.id,
    request.body as any,
    request.user.id,
  )
  return reply.status(201).send(result)
}

export async function completeUpload(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { documentId } = request.body as { documentId: string }
  const result = await documentService.completeUpload(request.params.id, documentId)
  if (!result) return reply.status(404).send({ error: 'Document not found or invalid state', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function verifyDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { notes } = (request.body || {}) as { notes?: string }
  const result = await documentService.verifyDocument(request.params.id, request.user.id, notes)
  if (!result) return reply.status(404).send({ error: 'Document not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function rejectDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { notes } = (request.body || {}) as { notes?: string }
  const result = await documentService.rejectDocument(request.params.id, request.user.id, notes)
  if (!result) return reply.status(404).send({ error: 'Document not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function deleteDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const deleted = await documentService.deleteDocument(request.params.id)
  if (!deleted) return reply.status(404).send({ error: 'Document not found', code: 'NOT_FOUND' })
  return reply.status(204).send()
}

export async function downloadDocument(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await documentService.getDownloadUrl(request.params.id, request.user)
  if (!result) return reply.status(404).send({ error: 'Document not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function listRequirements(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const reqs = await documentService.listRequirements(request.params.id)
  return reply.send(reqs)
}

export async function createRequirement(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const req = await documentService.createRequirement(request.params.id, request.body as any)
  return reply.status(201).send(req)
}

export async function updateRequirement(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await documentService.updateRequirement(request.params.id, request.body as any)
  if (!result) return reply.status(404).send({ error: 'Requirement not found', code: 'NOT_FOUND' })
  return reply.send(result)
}
