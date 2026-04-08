import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import api from '@/lib/api/client'
import { useDocumentUpload } from './use-document-upload'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useDocumentUpload', () => {
  const mockFile = new File(['content'], 'passport.pdf', { type: 'application/pdf' })

  it('executes 3-step upload: get URL, PUT to GCS, confirm', async () => {
    // Step 1: API returns signed upload URL + documentId
    vi.mocked(api.post).mockResolvedValueOnce({
      uploadUrl: 'https://storage.googleapis.com/bucket/signed-url',
      documentId: 'doc-123',
    })

    // Step 2: mock global fetch for GCS PUT
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 200 }))

    // Step 3: confirm upload
    vi.mocked(api.post).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDocumentUpload(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        type: 'passport' as never,
        file: mockFile,
      })
    })

    // Verify step 1
    expect(api.post).toHaveBeenCalledWith('/students/me/documents/upload-url', {
      type: 'passport',
      filename: 'passport.pdf',
    })

    // Verify step 2 — PUT to signed URL
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://storage.googleapis.com/bucket/signed-url',
      expect.objectContaining({
        method: 'PUT',
        body: mockFile,
      }),
    )

    // Verify step 3 — confirm
    expect(api.post).toHaveBeenCalledWith('/students/me/documents/complete', {
      documentId: 'doc-123',
    })

    fetchSpy.mockRestore()
  })

  it('rejects when signed URL fetch fails', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ error: 'Unauthorized', code: 'AUTH_ERROR' })

    const { result } = renderHook(() => useDocumentUpload(), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          type: 'passport' as never,
          file: mockFile,
        }),
      ).rejects.toEqual(expect.objectContaining({ code: 'AUTH_ERROR' }))
    })
  })
})
