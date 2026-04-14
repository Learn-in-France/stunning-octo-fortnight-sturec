import type { PaginatedResponse, ApplicationListItem, ApplicationFilterInput } from '@sturec/shared'
import type { RequestUser } from '../../middleware/auth.js'

import * as repo from './repository.js'
import { toPrismaArgs, paginate } from '../../lib/pagination.js'
import { mapApplication } from '../../lib/mappers/index.js'

function canAccessStudent(
  student: { userId: string; assignedCounsellorId: string | null },
  user: RequestUser,
) {
  if (user.role === 'admin') return true
  if (user.role === 'counsellor') return student.assignedCounsellorId === user.id
  return student.userId === user.id
}

export async function listStudentApplications(
  studentId: string,
  user: RequestUser,
): Promise<ApplicationListItem[] | null> {
  if (user.role !== 'admin') {
    const student = await repo.findStudentAccess(studentId)
    if (!student || !canAccessStudent(student, user)) return null
  }
  const apps = await repo.findStudentApplications(studentId)
  return apps.map((a) => mapApplication(a, a.program, a.intake))
}

export async function listAllApplications(
  filters: ApplicationFilterInput,
): Promise<PaginatedResponse<ApplicationListItem>> {
  const args = toPrismaArgs(filters)
  const where = repo.buildApplicationWhere(filters)

  const [items, total] = await Promise.all([
    repo.findAllApplications({ ...args, where }),
    repo.countApplications(where),
  ])

  return paginate(
    items.map((a) => mapApplication(a, a.program, a.intake)),
    total,
    filters,
  )
}

export async function createApplication(
  studentId: string,
  data: { programId: string; intakeId?: string; notes?: string },
  userId: string,
  user: RequestUser,
): Promise<ApplicationListItem> {
  const student = user.role === 'admin' ? null : await repo.findStudentAccess(studentId)
  if (user.role !== 'admin' && (!student || !canAccessStudent(student, user))) {
    const error = new Error('Student not found')
    Object.assign(error, { statusCode: 404, code: 'STUDENT_NOT_FOUND' })
    throw error
  }
  const app = await repo.createApplication({
    studentId,
    programId: data.programId,
    intakeId: data.intakeId,
    notes: data.notes,
    createdBy: userId,
  })
  return mapApplication(app, app.program, app.intake)
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  user: RequestUser,
): Promise<ApplicationListItem | null> {
  const existing = await repo.findApplicationById(id)
  if (!existing) return null
  if (!canAccessStudent(existing.student, user)) return null

  const app = await repo.updateApplicationStatus(id, status as any, user.id)
  return mapApplication(app, app.program, app.intake)
}
