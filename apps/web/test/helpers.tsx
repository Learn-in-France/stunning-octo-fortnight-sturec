import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import type { AppUser, AuthErrorCode } from '@/providers/auth-provider'

// ─── Auth context mock ──────────────────────────────────────────
// We mock the AuthProvider module so we can inject user state directly.

let _mockUser: AppUser | null = null
let _mockLoading = false
let _mockAuthError: AuthErrorCode = null
const _mockSignOut = vi.fn()

vi.mock('@/providers/auth-provider', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: _mockUser,
    firebaseUser: null,
    loading: _mockLoading,
    authError: _mockAuthError,
    signOut: _mockSignOut,
  }),
}))

export function setMockAuth(opts: {
  user?: AppUser | null
  loading?: boolean
  authError?: AuthErrorCode
}) {
  _mockUser = opts.user ?? null
  _mockLoading = opts.loading ?? false
  _mockAuthError = opts.authError ?? null
}

export function getMockSignOut() {
  return _mockSignOut
}

// ─── Factories ──────────────────────────────────────────────────

export function makeUser(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: 'user-1',
    email: 'test@sturec.com',
    role: 'admin',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    avatarUrl: null,
    status: 'active',
    ...overrides,
  }
}

// ─── Render helper ──────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}
