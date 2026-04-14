import prisma from '../../lib/prisma.js'
import type { Prisma, DocumentStatus, RequirementStatus } from '@prisma/client'

// ─── Documents ──────────────────────────────────────────────

export function findStudentDocuments(studentId: string) {
  return prisma.document.findMany({
    where: { studentId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export function findStudentAccess(studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true, userId: true, assignedCounsellorId: true },
  })
}

export function findDocumentById(id: string) {
  return prisma.document.findFirst({
    where: { id, deletedAt: null },
  })
}

export function createDocument(data: {
  studentId: string
  uploadedBy: string
  type: string
  filename: string
  gcsPath: string
  mimeType?: string
  sizeBytes?: number
}) {
  return prisma.document.create({
    data: {
      studentId: data.studentId,
      uploadedBy: data.uploadedBy,
      type: data.type as any,
      filename: data.filename,
      gcsPath: data.gcsPath,
      mimeType: data.mimeType || 'application/octet-stream',
      sizeBytes: data.sizeBytes || 0,
      status: 'pending_upload' as any,
    },
  })
}

export function completeUpload(id: string, data: { mimeType: string; sizeBytes: number }) {
  return prisma.document.update({
    where: { id },
    data: {
      status: 'pending' as DocumentStatus,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    },
  })
}

export function verifyDocument(id: string, verifiedBy: string, notes?: string) {
  return prisma.document.update({
    where: { id },
    data: {
      status: 'verified' as DocumentStatus,
      verifiedBy,
      verifiedAt: new Date(),
      notes,
    },
  })
}

export function rejectDocument(id: string, verifiedBy: string, notes?: string) {
  return prisma.document.update({
    where: { id },
    data: {
      status: 'rejected' as DocumentStatus,
      verifiedBy,
      verifiedAt: new Date(),
      notes,
    },
  })
}

export function shareDocument(id: string, counsellorId: string) {
  return prisma.document.update({
    where: { id },
    data: {
      sharedAt: new Date(),
      sharedWithCounsellorId: counsellorId,
      revokedAt: null,
    },
  })
}

export function revokeDocumentShare(id: string) {
  return prisma.document.update({
    where: { id },
    data: {
      revokedAt: new Date(),
    },
  })
}

export function findSharedDocuments(studentId: string, counsellorId: string) {
  return prisma.document.findMany({
    where: {
      studentId,
      deletedAt: null,
      sharedAt: { not: null },
      sharedWithCounsellorId: counsellorId,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function findAllDocumentsForAdmin(studentId: string) {
  return prisma.document.findMany({
    where: { studentId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export function softDeleteDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// ─── Document Requirements ──────────────────────────────────

export function findStudentRequirements(studentId: string) {
  return prisma.studentDocumentRequirement.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export function findRequirementById(id: string) {
  return prisma.studentDocumentRequirement.findUnique({ where: { id } })
}

export function createRequirement(data: {
  studentId: string
  documentType: string
  requirementSource: string
  required?: boolean
  notes?: string
  dueDate?: string
}) {
  return prisma.studentDocumentRequirement.create({
    data: {
      studentId: data.studentId,
      documentType: data.documentType,
      requirementSource: data.requirementSource as any,
      required: data.required ?? true,
      notes: data.notes,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  })
}

export function updateRequirement(id: string, data: {
  status?: string
  notes?: string
  required?: boolean
}) {
  return prisma.studentDocumentRequirement.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as RequirementStatus }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.required !== undefined && { required: data.required }),
    },
  })
}
