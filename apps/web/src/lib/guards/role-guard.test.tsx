import { screen } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../test/helpers'
import { replaceMock } from '../../../test/setup'
import { RoleGuard } from './role-guard'

describe('RoleGuard', () => {
  afterEach(() => {
    setMockAuth({})
    replaceMock.mockClear()
  })

  it('renders children for an allowed role', () => {
    setMockAuth({ user: makeUser({ role: 'admin' }) })
    renderWithProviders(
      <RoleGuard allowed={['admin', 'counsellor']}>
        <p>Admin Area</p>
      </RoleGuard>,
    )
    expect(screen.getByText('Admin Area')).toBeInTheDocument()
  })

  it('redirects student to /portal when role is not allowed', () => {
    setMockAuth({ user: makeUser({ role: 'student' }) })
    renderWithProviders(
      <RoleGuard allowed={['admin']}>
        <p>Admin Area</p>
      </RoleGuard>,
    )
    expect(screen.queryByText('Admin Area')).not.toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/portal')
  })

  it('redirects non-student to /dashboard when role is not allowed', () => {
    setMockAuth({ user: makeUser({ role: 'counsellor' }) })
    renderWithProviders(
      <RoleGuard allowed={['admin']}>
        <p>Admin Area</p>
      </RoleGuard>,
    )
    expect(replaceMock).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to custom path when redirectTo is specified', () => {
    setMockAuth({ user: makeUser({ role: 'student' }) })
    renderWithProviders(
      <RoleGuard allowed={['admin']} redirectTo="/custom">
        <p>Admin Area</p>
      </RoleGuard>,
    )
    expect(replaceMock).toHaveBeenCalledWith('/custom')
  })

  it('shows loading while auth resolves', () => {
    setMockAuth({ loading: true })
    renderWithProviders(
      <RoleGuard allowed={['admin']}>
        <p>Admin Area</p>
      </RoleGuard>,
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
