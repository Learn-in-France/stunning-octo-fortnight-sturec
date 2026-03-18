export type DocumentType =
  | 'passport'
  | 'transcript'
  | 'sop'
  | 'financial_proof'
  | 'accommodation'
  | 'offer_letter'
  | 'other'

export type DocumentStatus = 'pending_upload' | 'pending' | 'verified' | 'rejected'

export type RequirementSource = 'visa' | 'admission' | 'housing' | 'custom'

export type RequirementStatus =
  | 'missing'
  | 'requested'
  | 'uploaded'
  | 'verified'
  | 'rejected'
  | 'waived'

export interface Document {
  id: string
  studentId: string
  uploadedBy: string
  type: DocumentType
  filename: string
  gcsPath: string
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  isCurrent: boolean
  replacesDocumentId: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  notes: string | null
  createdAt: string
  deletedAt: string | null
}

export interface StudentDocumentRequirement {
  id: string
  studentId: string
  documentType: string
  requirementSource: RequirementSource
  required: boolean
  status: RequirementStatus
  notes: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}
