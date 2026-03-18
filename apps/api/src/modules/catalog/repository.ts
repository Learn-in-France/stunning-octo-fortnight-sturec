import prisma from '../../lib/prisma.js'
import type { Prisma } from '@prisma/client'

// ─── Universities ─────────────────────────────────────────────

export function findUniversities(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
}) {
  return prisma.university.findMany({
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
  })
}

export function countUniversities() {
  return prisma.university.count()
}

export function findUniversityById(id: string) {
  return prisma.university.findUnique({ where: { id } })
}

export function createUniversity(data: Prisma.UniversityCreateInput) {
  return prisma.university.create({ data })
}

export function updateUniversity(id: string, data: Prisma.UniversityUpdateInput) {
  return prisma.university.update({ where: { id }, data })
}

export function findActiveUniversities(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
}) {
  return prisma.university.findMany({
    where: { active: true },
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
  })
}

export function countActiveUniversities() {
  return prisma.university.count({ where: { active: true } })
}

// ─── Programs ─────────────────────────────────────────────────

export function findPrograms(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
}) {
  return prisma.program.findMany({
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
    include: { university: { select: { name: true } } },
  })
}

export function countPrograms() {
  return prisma.program.count()
}

export function findProgramById(id: string) {
  return prisma.program.findUnique({
    where: { id },
    include: { university: { select: { name: true } } },
  })
}

export function createProgram(data: Prisma.ProgramUncheckedCreateInput) {
  return prisma.program.create({
    data,
    include: { university: { select: { name: true } } },
  })
}

export function updateProgram(id: string, data: Prisma.ProgramUncheckedUpdateInput) {
  return prisma.program.update({
    where: { id },
    data,
    include: { university: { select: { name: true } } },
  })
}

export function findActivePrograms(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
  where?: Prisma.ProgramWhereInput
}) {
  const where: Prisma.ProgramWhereInput = {
    active: true,
    ...args.where,
  }
  return prisma.program.findMany({
    where,
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
    include: { university: { select: { name: true } } },
  })
}

export function countActivePrograms(where?: Prisma.ProgramWhereInput) {
  return prisma.program.count({ where: { active: true, ...where } })
}

// ─── Program Intakes ──────────────────────────────────────────

export function findIntakesByProgram(programId: string) {
  return prisma.programIntake.findMany({
    where: { programId },
    orderBy: { startYear: 'asc' },
  })
}

export function findIntakeById(id: string) {
  return prisma.programIntake.findUnique({ where: { id } })
}

export function createIntake(data: Prisma.ProgramIntakeUncheckedCreateInput) {
  return prisma.programIntake.create({ data })
}

export function updateIntake(id: string, data: Prisma.ProgramIntakeUncheckedUpdateInput) {
  return prisma.programIntake.update({ where: { id }, data })
}

// ─── Visa Requirements ───────────────────────────────────────

export function findVisaRequirements(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
}) {
  return prisma.visaRequirement.findMany({
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
  })
}

export function countVisaRequirements() {
  return prisma.visaRequirement.count()
}

export function findVisaRequirementById(id: string) {
  return prisma.visaRequirement.findUnique({ where: { id } })
}

export function createVisaRequirement(data: Prisma.VisaRequirementUncheckedCreateInput) {
  return prisma.visaRequirement.create({ data })
}

export function updateVisaRequirement(id: string, data: Prisma.VisaRequirementUncheckedUpdateInput) {
  return prisma.visaRequirement.update({ where: { id }, data })
}

// ─── Eligibility Rules ───────────────────────────────────────

export function findEligibilityRules(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
}) {
  return prisma.eligibilityRule.findMany({
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
  })
}

export function countEligibilityRules() {
  return prisma.eligibilityRule.count()
}

export function findEligibilityRuleById(id: string) {
  return prisma.eligibilityRule.findUnique({ where: { id } })
}

export function createEligibilityRule(data: Prisma.EligibilityRuleUncheckedCreateInput) {
  return prisma.eligibilityRule.create({ data })
}

export function updateEligibilityRule(id: string, data: Prisma.EligibilityRuleUncheckedUpdateInput) {
  return prisma.eligibilityRule.update({ where: { id }, data })
}

// ─── Campus France Prep ──────────────────────────────────────

export function findCampusFrancePreps(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
}) {
  return prisma.campusFrancePrep.findMany({
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
  })
}

export function countCampusFrancePreps() {
  return prisma.campusFrancePrep.count()
}

export function findCampusFrancePrepById(id: string) {
  return prisma.campusFrancePrep.findUnique({ where: { id } })
}

export function createCampusFrancePrep(data: Prisma.CampusFrancePrepUncheckedCreateInput) {
  return prisma.campusFrancePrep.create({ data })
}

export function updateCampusFrancePrep(id: string, data: Prisma.CampusFrancePrepUncheckedUpdateInput) {
  return prisma.campusFrancePrep.update({ where: { id }, data })
}
