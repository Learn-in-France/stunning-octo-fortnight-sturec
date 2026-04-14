import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../../test/helpers'
import api from '@/lib/api/client'
import ProfilePage from './page'

const MOCK_STUDENT_PROFILE = {
  id: 's-1',
  referenceCode: 'STU-042',
  stage: 'admitted',
  stageUpdatedAt: '2025-01-01',
  degreeLevel: 'master',
  bachelorDegree: 'Computer Science',
  gpa: 3.8,
  graduationYear: 2024,
  englishTestType: 'ielts',
  englishScore: 7.5,
  preferredCity: 'Paris',
  preferredIntake: 'Fall 2025',
  housingNeeded: true,
  budgetMin: 8000,
  budgetMax: 15000,
  fundingRoute: 'Scholarship',
  whatsappConsent: true,
  emailConsent: false,
  parentInvolvement: true,
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
}

const MOCK_USER_PROFILE = {
  id: 'u-1',
  email: 'student@test.com',
  role: 'student',
  firstName: 'Omar',
  lastName: 'Benali',
  phone: '+33612345678',
  avatarUrl: null,
  status: 'active',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-15',
}

function mockProfileLoads() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.includes('/students/me')) return Promise.resolve(MOCK_STUDENT_PROFILE)
    if (url.includes('/users/me')) return Promise.resolve(MOCK_USER_PROFILE)
    return Promise.resolve({})
  })
}

describe('ProfilePage', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ role: 'student' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('renders profile data across all sections', async () => {
    mockProfileLoads()

    renderWithProviders(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('STU-042')).toBeInTheDocument()
    })

    // Academic background
    expect(screen.getByText('Computer Science')).toBeInTheDocument()
    expect(screen.getByText('3.8 / 4.0')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('IELTS')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()

    // Study preferences
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('Fall 2025')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()

    // Financial
    expect(screen.getByText(/EUR 8,000 - 15,000/)).toBeInTheDocument()
    expect(screen.getByText('Scholarship')).toBeInTheDocument()

    // Communication prefs
    expect(screen.getByText(/WhatsApp: Opted in/)).toBeInTheDocument()
    expect(screen.getByText(/Email: Opted out/)).toBeInTheDocument()
    expect(screen.getByText(/Parent Involvement: Opted in/)).toBeInTheDocument()
  })

  it('shows enabled edit button that switches to edit mode', async () => {
    mockProfileLoads()
    const user = userEvent.setup()

    renderWithProviders(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('STU-042')).toBeInTheDocument()
    })

    const editBtn = screen.getByRole('button', { name: /edit profile/i })
    expect(editBtn).toBeEnabled()

    await user.click(editBtn)

    // Edit mode: form inputs appear, Cancel button shows
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('saves account, profile, and notification preference changes', async () => {
    mockProfileLoads()
    vi.mocked(api.patch)
      .mockResolvedValueOnce({
        ...MOCK_USER_PROFILE,
        firstName: 'Amira',
      })
      .mockResolvedValueOnce({
        ...MOCK_STUDENT_PROFILE,
        preferredCity: 'Lyon',
      })
      .mockResolvedValueOnce({
        whatsappConsent: false,
        emailConsent: true,
      })

    const user = userEvent.setup()

    renderWithProviders(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('STU-042')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit profile/i }))

    const firstNameInput = screen.getByDisplayValue('Omar')
    const preferredCityInput = screen.getByDisplayValue('Paris')
    const whatsappCheckbox = screen.getByRole('checkbox', { name: /whatsapp notifications/i })

    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Amira')
    await user.clear(preferredCityInput)
    await user.type(preferredCityInput, 'Lyon')
    await user.click(whatsappCheckbox)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/me', {
        firstName: 'Amira',
        lastName: 'Benali',
        phone: '+33612345678',
      })
    })

    expect(api.patch).toHaveBeenCalledWith('/students/me', expect.objectContaining({
      degreeLevel: 'master',
      bachelorDegree: 'Computer Science',
      gpa: 3.8,
      graduationYear: 2024,
      englishTestType: 'ielts',
      englishScore: 7.5,
      preferredCity: 'Lyon',
      preferredIntake: 'Fall 2025',
      housingNeeded: true,
      budgetMin: 8000,
      budgetMax: 15000,
      fundingRoute: 'Scholarship',
    }))

    expect(api.patch).toHaveBeenCalledWith('/students/me/notification-preferences', {
      whatsappConsent: false,
      emailConsent: false,
    })
  })

  it('shows error state when profile fails to load', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ error: 'Failed' })

    renderWithProviders(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Could not load your profile.')).toBeInTheDocument()
    })
  })
})
