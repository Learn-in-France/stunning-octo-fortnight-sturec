import { screen } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../test/helpers'
import { replaceMock } from '../../../test/setup'
import { AuthGuard } from './auth-guard'

describe('AuthGuard', () => {
  afterEach(() => {
    setMockAuth({})
    replaceMock.mockClear()
  })

  it('shows loading spinner while auth is resolving', () => {
    setMockAuth({ loading: true })
    renderWithProviders(
      <AuthGuard>
        <p>Protected</p>
      </AuthGuard>,
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    setMockAuth({ user: makeUser() })
    renderWithProviders(
      <AuthGuard>
        <p>Protected</p>
      </AuthGuard>,
    )
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('redirects to login when no user', async () => {
    setMockAuth({ user: null, loading: false })
    renderWithProviders(
      <AuthGuard>
        <p>Protected</p>
      </AuthGuard>,
    )
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/auth/login')
  })
})
