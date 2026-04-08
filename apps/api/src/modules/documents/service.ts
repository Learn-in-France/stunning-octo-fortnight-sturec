import type {
  DocumentListItem,
  DocumentRequirementItem,
  UploadUrlResponse,
} from '@sturec/shared'

import * as repo from './repository.js'
import { mapDocument, mapDocumentRequirement } from '../../lib/mappers/index.js'
import * as gcs from '../../integrations/gcs/index.js'
import { getDocumentsQueue } from '../../lib/queue/index.js'

// ─── Documents ──────────────────────────────────────────────

export async function listDocuments(studentId: string): Promise<DocumentListItem[]> {
  const docs = await repo.findStudentDocuments(studentId)
  return docs.map(mapDocument)
}

export async function requestUploadUrl(
  studentId: string,
  data: { type: string; filename: string },
  userId: string,
): Promise<UploadUrlResponse> {
  const gcsPath = `students/${studentId}/documents/${Date.now()}-${data.filename}`

  const doc = await repo.createDocument({
    studentId,
    uploadedBy: userId,
    type: data.type,
    filename: data.filename,
    gcsPath,
  })

  const contentType = guessContentType(data.filename)
  const uploadUrl = gcs.generateSignedUploadUrl(gcsPath, contentType)

  return {
    uploadUrl,
    documentId: doc.id,
    gcsPath,
  }
}

export async function completeUpload(
  studentId: string,
  documentId: string,
): Promise<DocumentListItem | null> {
  const doc = await repo.findDocumentById(documentId)
  if (!doc || doc.studentId !== studentId) return null
  if (doc.status !== 'pending_upload') return null

  // Verify file exists in GCS and read metadata
  const metadata = await gcs.getObjectMetadata(doc.gcsPath)
  if (!metadata) return null // File not uploaded to GCS yet

  const updated = await repo.completeUpload(documentId, {
    mimeType: metadata.contentType,
    sizeBytes: metadata.size,
  })

  // Emit document upload complete event
  getDocumentsQueue().add('upload-complete', {
    documentId,
    eventType: 'upload_complete',
  }).catch((err) => console.error('[documents] Failed to enqueue upload_complete:', err))

  return mapDocument(updated)
}

export async function verifyDocument(
  id: string,
  userId: string,
  notes?: string,
): Promise<DocumentListItem | null> {
  const doc = await repo.findDocumentById(id)
  if (!doc) return null

  const updated = await repo.verifyDocument(id, userId, notes)

  // Emit document verified event
  getDocumentsQueue().add('doc-verified', {
    documentId: id,
    eventType: 'verified',
  }).catch((err) => console.error('[documents] Failed to enqueue verified:', err))

  return mapDocument(updated)
}

export async function rejectDocument(
  id: string,
  userId: string,
  notes?: string,
): Promise<DocumentListItem | null> {
  const doc = await repo.findDocumentById(id)
  if (!doc) return null

  const updated = await repo.rejectDocument(id, userId, notes)

  // Emit document rejected event
  getDocumentsQueue().add('doc-rejected', {
    documentId: id,
    eventType: 'rejected',
  }).catch((err) => console.error('[documents] Failed to enqueue rejected:', err))

  return mapDocument(updated)
}

export async function shareDocument(
  documentId: string,
  studentId: string,
  counsellorId: string,
): Promise<DocumentListItem | null> {
  const doc = await repo.findDocumentById(documentId)
  if (!doc || doc.studentId !== studentId) return null
  if (doc.status === 'pending_upload') return null

  const updated = await repo.shareDocument(documentId, counsellorId)
  return mapDocument(updated)
}

export async function revokeDocument(
  documentId: string,
  studentId: string,
): Promise<DocumentListItem | null> {
  const doc = await repo.findDocumentById(documentId)
  if (!doc || doc.studentId !== studentId) return null

  const updated = await repo.revokeDocumentShare(documentId)
  return mapDocument(updated)
}

export async function listSharedDocuments(
  studentId: string,
  counsellorId: string,
): Promise<DocumentListItem[]> {
  const docs = await repo.findSharedDocuments(studentId, counsellorId)
  return docs.map(mapDocument)
}

export async function listAllDocumentsForAdmin(studentId: string): Promise<DocumentListItem[]> {
  const docs = await repo.findAllDocumentsForAdmin(studentId)
  return docs.map(mapDocument)
}

export async function deleteDocument(id: string): Promise<boolean> {
  const doc = await repo.findDocumentById(id)
  if (!doc) return false

  await repo.softDeleteDocument(id)
  return true
}

// ─── Requirements ───────────────────────────────────────────

export async function listRequirements(studentId: string): Promise<DocumentRequirementItem[]> {
  const reqs = await repo.findStudentRequirements(studentId)
  return reqs.map(mapDocumentRequirement)
}

export async function createRequirement(
  studentId: string,
  data: {
    documentType: string
    requirementSource: string
    required?: boolean
    notes?: string
    dueDate?: string
  },
): Promise<DocumentRequirementItem> {
  const req = await repo.createRequirement({ studentId, ...data })
  return mapDocumentRequirement(req)
}

export async function updateRequirement(
  id: string,
  data: { status?: string; notes?: string; required?: boolean },
): Promise<DocumentRequirementItem | null> {
  const existing = await repo.findRequirementById(id)
  if (!existing) return null

  const updated = await repo.updateRequirement(id, data)
  return mapDocumentRequirement(updated)
}

// ─── Download URL ───────────────────────────────────────────

export async function getDownloadUrl(
  id: string,
  user: { id: string; role: 'admin' | 'counsellor' | 'student' },
): Promise<{ downloadUrl: string } | null> {
  const doc = await repo.findDocumentById(id)
  if (!doc) return null
  if (user.role === 'counsellor') {
    if (doc.sharedWithCounsellorId !== user.id || doc.revokedAt) return null
  }
  if (user.role === 'student') return null

  const downloadUrl = gcs.generateSignedDownloadUrl(doc.gcsPath)
  return { downloadUrl }
}

// ─── Helpers ────────────────────────────────────────────────

const CONTENT_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return CONTENT_TYPE_MAP[ext] || 'application/octet-stream'
}
