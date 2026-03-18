import type { User } from '@sturec/shared'

export const MOCK_USERS: User[] = [
  {
    id: 'usr_admin_01',
    firebaseUid: 'fb_admin_01',
    email: 'sarah.martin@sturec.com',
    role: 'admin',
    firstName: 'Sarah',
    lastName: 'Martin',
    phone: '+33 6 12 34 56 78',
    avatarUrl: null,
    invitedBy: null,
    invitedAt: null,
    status: 'active',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 'usr_counsel_01',
    firebaseUid: 'fb_counsel_01',
    email: 'marc.dupont@sturec.com',
    role: 'counsellor',
    firstName: 'Marc',
    lastName: 'Dupont',
    phone: '+33 6 98 76 54 32',
    avatarUrl: null,
    invitedBy: 'usr_admin_01',
    invitedAt: '2025-02-01T09:00:00Z',
    status: 'active',
    createdAt: '2025-02-01T09:00:00Z',
    updatedAt: '2025-02-01T09:00:00Z',
    deletedAt: null,
  },
  {
    id: 'usr_counsel_02',
    firebaseUid: 'fb_counsel_02',
    email: 'amina.fall@sturec.com',
    role: 'counsellor',
    firstName: 'Amina',
    lastName: 'Fall',
    phone: '+33 6 55 44 33 22',
    avatarUrl: null,
    invitedBy: 'usr_admin_01',
    invitedAt: '2025-02-15T09:00:00Z',
    status: 'active',
    createdAt: '2025-02-15T09:00:00Z',
    updatedAt: '2025-02-15T09:00:00Z',
    deletedAt: null,
  },
]

export const MOCK_COUNSELLORS = MOCK_USERS.filter((u) => u.role === 'counsellor')

export function getCounsellorName(id: string | null): string {
  if (!id) return 'Unassigned'
  const u = MOCK_USERS.find((u) => u.id === id)
  return u ? `${u.firstName} ${u.lastName}` : 'Unknown'
}
