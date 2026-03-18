import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// ─── Mock Next.js navigation ────────────────────────────────────
const pushMock = vi.fn()
const replaceMock = vi.fn()
const backMock = vi.fn()
const prefetchMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    back: backMock,
    prefetch: prefetchMock,
    pathname: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// ─── Mock Next.js Link ──────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => {
    const React = require('react')
    return React.createElement('a', { href, ...props }, children)
  },
}))

// ─── Mock Firebase ──────────────────────────────────────────────
vi.mock('@/lib/auth/firebase', () => ({
  auth: null,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
}))

// ─── Mock API client ────────────────────────────────────────────
// Tests mock individual calls via vi.mocked(api.get).mockResolvedValue(...)
vi.mock('@/lib/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// ─── Mock env config ────────────────────────────────────────────
vi.mock('@/lib/config/env', () => ({
  env: {
    apiUrl: 'http://localhost:3001',
    firebase: { apiKey: '', authDomain: '', projectId: '' },
  },
}))

// Re-export mocks for easy access in tests
export { pushMock, replaceMock, backMock }
