import type { DecodedIdToken } from 'firebase-admin/auth'
import type { AuthUserResponse, InviteValidationResponse } from '@sturec/shared'
import { createHash } from 'node:crypto'

import * as authRepo from './repository.js'
import { mapUserToAuthResponse } from '../../lib/mappers/index.js'

/**
 * POST /auth/verify — check if a Firebase-authenticated user has an app record.
 * Used by all roles on sign-in.
 */
export async function verifyUser(decoded: DecodedIdToken): Promise<AuthUserResponse | null> {
  const user = await authRepo.findUserByFirebaseUid(decoded.uid)
  if (!user) return null
  await ensurePortalReadyStudent(user)
  return mapUserToAuthResponse(user, decoded.email_verified === true)
}

/**
 * POST /auth/register — student/public registration ONLY.
 *
 * This endpoint creates a new user record with role=student. It must NOT be
 * used by internal team members (admin/counsellor). Internal users activate
 * their accounts via POST /auth/accept-invite.
 *
 * Guards:
 *  - If user already exists by Firebase UID → idempotent return (student re-registering)
 *  - If an invited user record exists for this email → reject with USE_ACCEPT_INVITE
 */
export async function registerUser(
  decoded: DecodedIdToken,
  body?: { firstName?: string; lastName?: string },
): Promise<{ user: AuthUserResponse } | { error: string; code: string }> {
  // Idempotent: if user already exists by Firebase UID, return it
  const existing = await authRepo.findUserByFirebaseUid(decoded.uid)
  if (existing) {
    await ensurePortalReadyStudent(existing)
    return { user: mapUserToAuthResponse(existing, decoded.email_verified === true) }
  }

  // Guard: if an invited internal user exists for this email, reject
  const invited = await authRepo.findInvitedUserByEmail(decoded.email!)
  if (invited) {
    return {
      error: 'This email has a pending team invite. Use POST /auth/accept-invite instead.',
      code: 'USE_ACCEPT_INVITE',
    }
  }

  // Guard: if a user record already exists for this email (e.g. deactivated, or
  // different Firebase UID), reject — they should use verify or contact admin
  const emailUser = await authRepo.findUserByEmail(decoded.email!)
  if (emailUser) {
    return {
      error: 'An account already exists for this email. Use POST /auth/verify instead.',
      code: 'USE_VERIFY',
    }
  }

  const firstName = body?.firstName || decoded.name?.split(' ')[0] || 'User'
  const lastName = body?.lastName || decoded.name?.split(' ').slice(1).join(' ') || ''

  const user = await authRepo.createUser({
    firebaseUid: decoded.uid,
    email: decoded.email!,
    firstName,
    lastName,
    role: 'student',
  })

  // Link any existing leads with matching email
  await authRepo.linkLeadToUser(decoded.email!, user.id)
  await ensurePortalReadyStudent(user)

  return { user: mapUserToAuthResponse(user, decoded.email_verified === true) }
}

/**
 * GET /users/me — return current user profile.
 */
export async function getUserProfile(
  userId: string,
  emailVerified: boolean,
): Promise<AuthUserResponse | null> {
  const user = await authRepo.findUserById(userId)
  if (!user) return null
  return mapUserToAuthResponse(user, emailVerified)
}

/**
 * PATCH /users/me — update current user's profile fields.
 */
export async function updateUserProfile(
  userId: string,
  emailVerified: boolean,
  data: { firstName?: string; lastName?: string; phone?: string },
): Promise<AuthUserResponse | null> {
  const user = await authRepo.findUserById(userId)
  if (!user) return null
  const updated = await authRepo.updateUserProfile(userId, data)
  return mapUserToAuthResponse(updated, emailVerified)
}

/**
 * POST /auth/accept-invite — internal team activation ONLY.
 *
 * Links a Firebase UID to a pre-created invited user record.
 * This is the only path for admin/counsellor account activation.
 */
export async function validateInvite(
  data: { email: string; token: string },
): Promise<InviteValidationResponse | null> {
  const invite = await authRepo.validateInvite(
    data.email,
    hashInviteToken(data.token),
  )
  if (!invite) return null

  return {
    email: invite.email,
    role: invite.role as InviteValidationResponse['role'],
    firstName: invite.firstName,
    lastName: invite.lastName,
    expiresAt: invite.inviteTokenExpiresAt!.toISOString(),
  }
}

export async function acceptInvite(
  decoded: DecodedIdToken,
  data: { token: string; firstName: string; lastName: string },
): Promise<AuthUserResponse | null> {
  const invitedUser = await authRepo.findValidInviteByEmailAndTokenHash(
    decoded.email!,
    hashInviteToken(data.token),
  )
  if (!invitedUser) return null

  const user = await authRepo.acceptInviteForUser({
    userId: invitedUser.id,
    firebaseUid: decoded.uid,
    firstName: data.firstName,
    lastName: data.lastName,
  })
  return mapUserToAuthResponse(user, decoded.email_verified === true)
}

async function ensurePortalReadyStudent(user: {
  id: string
  role: 'student' | 'counsellor' | 'admin'
}) {
  if (user.role !== 'student') return

  const existingStudent = await authRepo.findStudentByUserId(user.id)
  if (existingStudent) return existingStudent

  const latestLead = await authRepo.findLatestLeadByUserId(user.id)

  return authRepo.upsertStudentForUser({
    userId: user.id,
    source: latestLead?.source ?? 'direct_signup',
    sourcePartner: latestLead?.sourcePartner ?? null,
  })
}

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
