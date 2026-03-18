import type { PaginationInput, PaginatedResponse, PublicCatalogFilterInput } from '@sturec/shared'
import type {
  UniversityItem,
  ProgramItem,
  ProgramIntakeItem,
} from '@sturec/shared'
import type { Prisma } from '@prisma/client'

import * as repo from './repository.js'
import { toPrismaArgs, paginate } from '../../lib/pagination.js'
import { mapUniversity, mapProgram, mapProgramIntake } from '../../lib/mappers/index.js'

// ─── Universities ─────────────────────────────────────────────

export async function listUniversities(pagination: PaginationInput): Promise<PaginatedResponse<UniversityItem>> {
  const args = toPrismaArgs(pagination)
  const [items, total] = await Promise.all([
    repo.findUniversities(args),
    repo.countUniversities(),
  ])
  return paginate(items.map(mapUniversity), total, pagination)
}

export async function getUniversity(id: string) {
  const uni = await repo.findUniversityById(id)
  if (!uni) return null
  return mapUniversity(uni)
}

export async function createUniversity(
  data: {
    name: string
    city: string
    country?: string
    websiteUrl?: string
    partnerStatus?: string
    notes?: string
  },
  userId: string,
) {
  const uni = await repo.createUniversity({
    ...data,
    country: data.country || 'France',
    creator: { connect: { id: userId } },
  })
  return mapUniversity(uni)
}

export async function updateUniversity(id: string, data: Record<string, unknown>, userId: string) {
  const uni = await repo.updateUniversity(id, { ...data, updater: { connect: { id: userId } } })
  return mapUniversity(uni)
}

// ─── Programs ─────────────────────────────────────────────────

export async function listPrograms(pagination: PaginationInput): Promise<PaginatedResponse<ProgramItem>> {
  const args = toPrismaArgs(pagination)
  const [items, total] = await Promise.all([
    repo.findPrograms(args),
    repo.countPrograms(),
  ])
  return paginate(
    items.map((p) => mapProgram(p, p.university.name)),
    total,
    pagination,
  )
}

export async function getProgram(id: string) {
  const program = await repo.findProgramById(id)
  if (!program) return null
  return mapProgram(program, program.university.name)
}

export async function createProgram(
  data: {
    universityId: string
    name: string
    degreeLevel: string
    fieldOfStudy: string
    language?: string
    durationMonths: number
    tuitionAmount: number
    tuitionCurrency?: string
    minimumGpa?: number
    englishRequirementType?: string
    englishMinimumScore?: number
    description?: string
  },
  userId: string,
) {
  const program = await repo.createProgram({
    ...data,
    language: data.language || 'English',
    tuitionCurrency: data.tuitionCurrency || 'EUR',
    createdBy: userId,
  })
  return mapProgram(program, program.university.name)
}

export async function updateProgram(id: string, data: Record<string, unknown>, userId: string) {
  const program = await repo.updateProgram(id, { ...data, updatedBy: userId })
  return mapProgram(program, program.university.name)
}

// ─── Program Intakes ──────────────────────────────────────────

export async function listIntakes(programId: string): Promise<ProgramIntakeItem[]> {
  const intakes = await repo.findIntakesByProgram(programId)
  return intakes.map(mapProgramIntake)
}

export async function createIntake(
  programId: string,
  data: {
    intakeName: string
    startMonth: number
    startYear: number
    applicationDeadline?: string
  },
  userId: string,
) {
  const intake = await repo.createIntake({
    programId,
    ...data,
    applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
    createdBy: userId,
  })
  return mapProgramIntake(intake)
}

export async function updateIntake(id: string, data: Record<string, unknown>, userId: string) {
  const updateData: Record<string, unknown> = { ...data, updatedBy: userId }
  if (typeof updateData.applicationDeadline === 'string') {
    updateData.applicationDeadline = new Date(updateData.applicationDeadline as string)
  }
  const intake = await repo.updateIntake(id, updateData)
  return mapProgramIntake(intake)
}

// ─── Visa Requirements ───────────────────────────────────────

export async function listVisaRequirements(pagination: PaginationInput) {
  const args = toPrismaArgs(pagination)
  const [items, total] = await Promise.all([
    repo.findVisaRequirements(args),
    repo.countVisaRequirements(),
  ])
  return paginate(items, total, pagination)
}

export async function getVisaRequirement(id: string) {
  return repo.findVisaRequirementById(id)
}

export async function createVisaRequirement(data: Record<string, unknown>, userId: string) {
  return repo.createVisaRequirement({ ...data, createdBy: userId } as any)
}

export async function updateVisaRequirement(id: string, data: Record<string, unknown>, userId: string) {
  return repo.updateVisaRequirement(id, { ...data, updatedBy: userId })
}

// ─── Eligibility Rules ───────────────────────────────────────

export async function listEligibilityRules(pagination: PaginationInput) {
  const args = toPrismaArgs(pagination)
  const [items, total] = await Promise.all([
    repo.findEligibilityRules(args),
    repo.countEligibilityRules(),
  ])
  return paginate(items, total, pagination)
}

export async function getEligibilityRule(id: string) {
  return repo.findEligibilityRuleById(id)
}

export async function createEligibilityRule(data: Record<string, unknown>, userId: string) {
  return repo.createEligibilityRule({ ...data, createdBy: userId } as any)
}

export async function updateEligibilityRule(id: string, data: Record<string, unknown>, userId: string) {
  return repo.updateEligibilityRule(id, { ...data, updatedBy: userId })
}

// ─── Campus France Prep ──────────────────────────────────────

export async function listCampusFrancePreps(pagination: PaginationInput) {
  const args = toPrismaArgs(pagination)
  const [items, total] = await Promise.all([
    repo.findCampusFrancePreps(args),
    repo.countCampusFrancePreps(),
  ])
  return paginate(items, total, pagination)
}

export async function getCampusFrancePrep(id: string) {
  return repo.findCampusFrancePrepById(id)
}

export async function createCampusFrancePrep(data: Record<string, unknown>, userId: string) {
  return repo.createCampusFrancePrep({ ...data, createdBy: userId } as any)
}

export async function updateCampusFrancePrep(id: string, data: Record<string, unknown>, userId: string) {
  return repo.updateCampusFrancePrep(id, { ...data, updatedBy: userId })
}

// ─── Public ──────────────────────────────────────────────────

export async function listPublicPrograms(filters: PublicCatalogFilterInput) {
  const args = toPrismaArgs(filters)
  const where: Prisma.ProgramWhereInput = {}
  if (filters.degree) where.degreeLevel = filters.degree
  if (filters.field) where.fieldOfStudy = { contains: filters.field, mode: 'insensitive' }
  if (filters.city) where.university = { city: { contains: filters.city, mode: 'insensitive' } }
  if (filters.tuitionMin) where.tuitionAmount = { ...((where.tuitionAmount as any) || {}), gte: filters.tuitionMin }
  if (filters.tuitionMax) where.tuitionAmount = { ...((where.tuitionAmount as any) || {}), lte: filters.tuitionMax }

  const [items, total] = await Promise.all([
    repo.findActivePrograms({ ...args, where }),
    repo.countActivePrograms(where),
  ])
  return paginate(
    items.map((p) => mapProgram(p, p.university.name)),
    total,
    filters,
  )
}

export async function listPublicUniversities(pagination: PaginationInput) {
  const args = toPrismaArgs(pagination)
  const [items, total] = await Promise.all([
    repo.findActiveUniversities(args),
    repo.countActiveUniversities(),
  ])
  return paginate(items.map(mapUniversity), total, pagination)
}
