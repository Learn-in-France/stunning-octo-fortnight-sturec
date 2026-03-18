import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import api from '@/lib/api/client'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../../test/helpers'
import SupportPage from './page'

describe('SupportPage', () => {
  beforeEach(() => {
    setMockAuth({
      user: makeUser({
        role: 'student',
        firstName: 'Omar',
        lastName: 'Benali',
        email: 'student@test.com',
      }),
    })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('submits a support request via the API and shows confirmation', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'received',
      message: 'Your support request has been submitted. We will get back to you shortly.',
    })

    const user = userEvent.setup()

    renderWithProviders(<SupportPage />)

    await user.selectOptions(screen.getByRole('combobox'), 'visa')
    await user.type(screen.getByPlaceholderText(/brief description of your question/i), 'Need visa timeline help')
    await user.type(screen.getByPlaceholderText(/describe your issue or question in detail/i), 'When should I schedule my visa appointment?')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/students/me/support', {
        subject: 'Need visa timeline help',
        message: 'When should I schedule my visa appointment?',
        category: 'visa',
      })
    })

    expect(screen.getByText(/request submitted/i)).toBeInTheDocument()
    expect(screen.getByText(/within 24 hours/i)).toBeInTheDocument()
  })
})
