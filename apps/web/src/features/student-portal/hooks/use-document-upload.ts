import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentType, UploadUrlResponse } from '@sturec/shared'
import api from '@/lib/api/client'

interface UploadParams {
  type: DocumentType
  file: File
}

async function uploadDocument({ type, file }: UploadParams): Promise<void> {
  // 1. Get signed upload URL
  const { uploadUrl, documentId } = await api.post(
    '/students/me/documents/upload-url',
    { type, filename: file.name },
  ) as unknown as UploadUrlResponse

  // 2. Upload to GCS
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })

  // 3. Confirm upload
  await api.post('/students/me/documents/complete', { documentId })
}

export function useDocumentUpload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-portal', 'documents'] })
      qc.invalidateQueries({ queryKey: ['student-portal', 'requirements'] })
      qc.invalidateQueries({ queryKey: ['student-portal', 'progress'] })
    },
  })
}
