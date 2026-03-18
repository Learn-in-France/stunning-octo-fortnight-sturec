vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    use: (value: unknown) => {
      if (value && typeof (value as Promise<unknown>).then === 'function') {
        return { id: 'app-1' }
      }
      return actual.use(value as never)
    },
  }
})

import { screen } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../../../test/helpers'
import ApplicationDetailPage from './page'

const useStudentPortalApplicationMock = vi.fn()

vi.mock('@/features/student-portal/hooks/use-student-portal', () => ({
  useStudentPortalApplication: (id: string) => useStudentPortalApplicationMock(id),
}))

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ role: 'student' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('renders the application detail and status-specific guidance', async () => {
    useStudentPortalApplicationMock.mockReturnValue({
      data: {
        id: 'app-1',
        programName: 'MSc Data Science',
        universityName: 'Sorbonne University',
        intakeName: 'Fall 2025',
        status: 'offer',
        createdAt: '2025-01-01T00:00:00.000Z',
        submittedAt: '2025-01-05T00:00:00.000Z',
        decisionAt: '2025-02-01T00:00:00.000Z',
      },
      isLoading: false,
    })

    renderWithProviders(
      <ApplicationDetailPage params={Promise.resolve({ id: 'app-1' })} />,
    )

    expect(useStudentPortalApplicationMock).toHaveBeenCalledWith('app-1')
    expect(screen.getByRole('heading', { name: 'MSc Data Science' })).toBeInTheDocument()
    expect(screen.getAllByText('Sorbonne University').length).toBeGreaterThan(0)
    expect(screen.getByText(/congratulations/i)).toBeInTheDocument()
  })
})
