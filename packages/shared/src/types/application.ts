export type ApplicationStatus = 'draft' | 'submitted' | 'offer' | 'rejected' | 'enrolled'

export interface Application {
  id: string
  studentId: string
  programId: string
  intakeId: string | null
  status: ApplicationStatus
  submittedAt: string | null
  decisionAt: string | null
  offerLetterDocumentId: string | null
  notes: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}
