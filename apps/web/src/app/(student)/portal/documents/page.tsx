'use client'

import { useState, useRef } from 'react'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { DocumentStatus, DocumentType } from '@sturec/shared'
import { useStudentPortalDocuments } from '@/features/student-portal/hooks/use-student-portal'
import { useDocumentUpload } from '@/features/student-portal/hooks/use-document-upload'

const STATUS_CONFIG: Record<DocumentStatus, { label: string; variant: 'muted' | 'warning' | 'success' | 'danger' }> = {
  pending_upload: { label: 'Awaiting Upload', variant: 'muted' },
  pending: { label: 'Under Review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

const TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  transcript: 'Academic Transcript',
  sop: 'Statement of Purpose',
  financial_proof: 'Financial Proof',
  accommodation: 'Accommodation Proof',
  offer_letter: 'Offer Letter',
  other: 'Other',
}

const DOCUMENT_TYPES: DocumentType[] = ['passport', 'transcript', 'sop', 'financial_proof', 'accommodation', 'offer_letter', 'other']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function DocumentsPage() {
  const { data: documents, isLoading } = useStudentPortalDocuments()
  const upload = useDocumentUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showUpload, setShowUpload] = useState(false)
  const [selectedType, setSelectedType] = useState<DocumentType>('other')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const docs = documents ?? []

  function openUploadDialog() {
    setShowUpload(true)
    setUploadError(null)
    setUploadSuccess(false)
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadSuccess(false)

    try {
      await upload.mutateAsync({ type: selectedType, file })
      setUploadSuccess(true)
      setShowUpload(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'error' in err ? String((err as { error: string }).error) : 'Upload failed. Please try again.'
      setUploadError(msg)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            My Documents
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            All your uploaded documents and their verification status.
          </p>
        </div>
        <Button size="sm" onClick={openUploadDialog}>
          Upload Document
        </Button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <Card className="mb-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary font-display">Upload a Document</p>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                Document Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelected}
                disabled={upload.isPending}
                className="w-full text-sm text-text-primary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-border file:bg-surface-raised file:text-sm file:font-medium file:text-text-primary hover:file:bg-surface-sunken file:cursor-pointer disabled:opacity-50"
              />
            </div>
            {upload.isPending && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <LoadingSpinner size="sm" />
                <span>Uploading…</span>
              </div>
            )}
            {uploadError && (
              <p className="text-xs text-rose-600">{uploadError}</p>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Upload success banner */}
      {uploadSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-700 font-medium">Document uploaded successfully. It will be reviewed shortly.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(['verified', 'pending', 'rejected', 'pending_upload'] as DocumentStatus[]).map((status) => {
          const count = docs.filter((d) => d.status === status).length
          const config = STATUS_CONFIG[status]
          return (
            <div
              key={status}
              className="flex items-center gap-2 p-3 rounded-lg bg-surface-raised border border-border"
            >
              <Badge variant={config.variant} dot>
                {config.label}
              </Badge>
              <span className="ml-auto text-sm font-mono font-semibold text-text-primary">{count}</span>
            </div>
          )
        })}
      </div>

      {docs.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No documents uploaded"
            description="Upload your first document to get started with your application process."
            icon={
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M22 4H10C8.343 4 7 5.343 7 7V33C7 34.657 8.343 36 10 36H30C31.657 36 33 34.657 33 33V15L22 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M22 4V15H33" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            }
            action={{
              label: 'Upload Document',
              onClick: openUploadDialog,
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map((doc) => {
            const config = STATUS_CONFIG[doc.status]
            return (
              <Card key={doc.id}>
                <div className="flex items-start gap-3">
                  {/* File icon */}
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M11.5 2H5.5C4.672 2 4 2.672 4 3.5V16.5C4 17.328 4.672 18 5.5 18H14.5C15.328 18 16 17.328 16 16.5V6.5L11.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M11.5 2V6.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary font-display truncate">
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </p>
                      <Badge variant={config.variant} dot>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-1 truncate font-mono">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Uploaded {formatDate(doc.createdAt)}
                    </p>
                    {doc.status === 'rejected' && (
                      <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-100">
                        <p className="text-xs text-rose-700">
                          This document was rejected. Please re-upload a corrected version.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
