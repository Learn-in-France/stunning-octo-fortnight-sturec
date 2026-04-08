import type { FastifyRequest, FastifyReply } from 'fastify'
import * as studentService from './service.js'

type ReqWithQuery<Q = unknown> = FastifyRequest & { parsedQuery: Q }

export async function listStudents(request: FastifyRequest, reply: FastifyReply) {
  const result = await studentService.listStudents(
    (request as ReqWithQuery).parsedQuery as any,
    request.user,
  )
  return reply.send(result)
}

export async function getStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const student = await studentService.getStudent(request.params.id, request.user)
  if (!student) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(student)
}

export async function updateStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const student = await studentService.updateStudent(request.params.id, request.body as any)
  return reply.send(student)
}

export async function getProgress(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  // Progress is a computed view — delegate to service when backend computes it
  // For now return the student detail which contains the data needed
  const student = await studentService.getStudent(request.params.id, request.user)
  if (!student) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(student)
}

export async function changeStage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { toStage, reasonCode, reasonNote } = request.body as any
  const result = await studentService.changeStage(request.params.id, toStage, request.user.id, reasonCode, reasonNote)
  if (!result) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(result)
}

export async function assignCounsellor(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { counsellorId, reason } = request.body as { counsellorId: string; reason?: string }
  const result = await studentService.assignCounsellor(request.params.id, counsellorId, request.user.id, reason)
  return reply.send(result)
}

export async function listAssignments(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const assignments = await studentService.listAssignments(request.params.id)
  return reply.send(assignments)
}

export async function listTimeline(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const timeline = await studentService.listTimeline(request.params.id)
  return reply.send(timeline)
}

export async function listCaseLog(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const caseLog = await studentService.listCaseLog(request.params.id)
  return reply.send(caseLog)
}

export async function listNotes(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await studentService.listNotes(
    request.params.id,
    (request as ReqWithQuery).parsedQuery as any,
  )
  return reply.send(result)
}

export async function createNote(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const note = await studentService.createNote(request.params.id, request.body as any, request.user.id)
  return reply.status(201).send(note)
}

export async function listActivities(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await studentService.listActivities(
    request.params.id,
    (request as ReqWithQuery).parsedQuery as any,
  )
  return reply.send(result)
}

export async function createActivity(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const activity = await studentService.createActivity(request.params.id, request.body as any, request.user.id)
  if (!activity) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.status(201).send(activity)
}

export async function listContacts(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const contacts = await studentService.listContacts(request.params.id)
  return reply.send(contacts)
}

export async function createContact(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const contact = await studentService.createContact(request.params.id, request.body as any)
  return reply.status(201).send(contact)
}

export async function listConsents(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const consents = await studentService.listConsents(request.params.id)
  return reply.send(consents)
}

export async function createConsent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const consent = await studentService.createConsent(request.params.id, request.body as any, request.user.id)
  return reply.status(201).send(consent)
}

export async function listAssessments(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const assessments = await studentService.listAssessments(request.params.id)
  return reply.send(assessments)
}

export async function getAssessment(
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply,
) {
  const assessment = await studentService.getAssessment(request.params.id, request.params.assessmentId)
  if (!assessment) return reply.status(404).send({ error: 'Assessment not found', code: 'NOT_FOUND' })
  return reply.send(assessment)
}

export async function updateContact(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await studentService.updateContact(request.params.id, request.body as any)
  if (!result) return reply.status(404).send({ error: 'Contact not found', code: 'NOT_FOUND' })
  return reply.send(result)
}
