export type UserRole = 'student' | 'counsellor' | 'admin'

export type UserStatus = 'active' | 'invited' | 'deactivated'

export interface User {
  id: string
  firebaseUid: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  invitedBy: string | null
  invitedAt: string | null
  status: UserStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
