import { fireEvent, screen, waitFor } from '@testing-library/react'

import {
  getMockRefreshUser,
  getMockSignOut,
  renderWithProviders,
  setMockAuth,
} from '../../../../test/helpers'
import api from '@/lib/api/client'
import { deleteCurrentUser, signInWithGoogle, signUpWithEmail } from '@/lib/auth/firebase'
import RegisterPage from './page'
import { replaceMock } from '../../../../test/setup'

describe('RegisterPage', () => {
  afterEach(() => {
    setMockAuth({})
    vi.clearAllMocks()
  })

  it('registers a new student with email/password', async () => {
    setMockAuth({})
    getMockRefreshUser().mockResolvedValue({ role: 'student' })
    vi.mocked(signUpWithEmail).mockResolvedValue({} as never)
    vi.mocked(api.post).mockResolvedValue({} as never)

    renderWithProviders(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Awa' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Diallo' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'awa@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByText('Create account'))

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith('awa@example.com', 'password123')
    })
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      firstName: 'Awa',
      lastName: 'Diallo',
    })
    expect(getMockRefreshUser()).toHaveBeenCalled()
    expect(replaceMock).toHaveBeenCalledWith('/portal')
  })

  it('registers a new student with Google', async () => {
    setMockAuth({})
    getMockRefreshUser().mockResolvedValue({ role: 'student' })
    vi.mocked(signInWithGoogle).mockResolvedValue({
      user: {
        displayName: 'Awa Diallo',
        getIdToken: vi.fn().mockResolvedValue('google-token'),
      },
    } as never)
    vi.mocked(api.post).mockResolvedValue({} as never)

    renderWithProviders(<RegisterPage />)

    fireEvent.click(screen.getByText('Continue with Google'))

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled()
    })
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      firstName: 'Awa',
      lastName: 'Diallo',
    }, { headers: { Authorization: 'Bearer google-token' } })
    expect(getMockRefreshUser()).toHaveBeenCalled()
    expect(replaceMock).toHaveBeenCalledWith('/portal')
  })

  it('shows a cancellation message if Google popup is closed', async () => {
    setMockAuth({})
    getMockSignOut().mockResolvedValue(undefined)
    vi.mocked(signInWithGoogle).mockRejectedValue({ code: 'auth/popup-closed-by-user' })

    renderWithProviders(<RegisterPage />)

    fireEvent.click(screen.getByText('Continue with Google'))

    await waitFor(() => {
      expect(screen.getByText('Google sign-up was cancelled.')).toBeInTheDocument()
    })
    expect(getMockSignOut()).toHaveBeenCalled()
  })

  it('rolls back the Firebase account if backend registration fails after email signup', async () => {
    setMockAuth({})
    vi.mocked(signUpWithEmail).mockResolvedValue({} as never)
    vi.mocked(deleteCurrentUser).mockResolvedValue(undefined as never)
    vi.mocked(api.post).mockRejectedValue({ code: 'USE_VERIFY' })

    renderWithProviders(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Awa' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Diallo' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'awa@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByText('Create account'))

    await waitFor(() => {
      expect(deleteCurrentUser).toHaveBeenCalled()
    })
    expect(screen.getByText('An account with this email already exists. Try signing in instead.')).toBeInTheDocument()
  })
})
