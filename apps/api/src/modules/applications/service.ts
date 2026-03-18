import type { PaginatedResponse, ApplicationListItem, ApplicationFilterInput } from '@sturec/shared'

import * as repo from './repository.js'
import { toPrismaArgs, paginate } from '../../lib/pagination.js'
import { mapApplication } from '../../lib/mappers/index.js'

export async function listStudentApplications(studentId: string): Promise<ApplicationListItem[]> {
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
): Promise<ApplicationListItem> {
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
  userId: string,
): Promise<ApplicationListItem | null> {
  const existing = await repo.findApplicationById(id)
  if (!existing) return null

  const app = await repo.updateApplicationStatus(id, status as any, userId)
  return mapApplication(app, app.program, app.intake)
}
