import { useQuery } from '@tanstack/react-query'

import type {
  PaginatedResponse,
  PaginationParams,
  UniversityItem,
  ProgramItem,
  ProgramIntakeItem,
  VisaRequirement,
  EligibilityRule,
  CampusFrancePrep,
} from '@sturec/shared'
import api from '@/lib/api/client'

// ─── Universities ───────────────────────────────────────────

interface UseUniversitiesParams extends PaginationParams {
  search?: string
}

export function useUniversities(params: UseUniversitiesParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'universities', params],
    queryFn: () =>
      api.get('/catalog/universities', { params }) as unknown as PaginatedResponse<UniversityItem>,
  })
}

// ─── Programs ───────────────────────────────────────────────

interface UseProgramsParams extends PaginationParams {
  search?: string
  universityId?: string
  degreeLevel?: string
}

export function usePrograms(params: UseProgramsParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'programs', params],
    queryFn: () =>
      api.get('/catalog/programs', { params }) as unknown as PaginatedResponse<ProgramItem>,
  })
}

// ─── Intakes (program-scoped) ───────────────────────────────

interface UseIntakesParams extends PaginationParams {
  programId: string
}

export function useIntakes(params: UseIntakesParams) {
  const { programId, ...rest } = params
  return useQuery({
    queryKey: ['catalog', 'intakes', params],
    queryFn: () =>
      api.get(`/catalog/programs/${programId}/intakes`, { params: rest }) as unknown as PaginatedResponse<ProgramIntakeItem>,
    enabled: !!programId,
  })
}

// ─── Visa Requirements ──────────────────────────────────────

interface UseVisaRequirementsParams extends PaginationParams {
  search?: string
}

export function useVisaRequirements(params: UseVisaRequirementsParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'visa-requirements', params],
    queryFn: () =>
      api.get('/catalog/visa-requirements', { params }) as unknown as PaginatedResponse<VisaRequirement>,
  })
}

// ─── Eligibility Rules ──────────────────────────────────────

interface UseEligibilityRulesParams extends PaginationParams {
  search?: string
  programId?: string
}

export function useEligibilityRules(params: UseEligibilityRulesParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'eligibility-rules', params],
    queryFn: () =>
      api.get('/catalog/eligibility-rules', { params }) as unknown as PaginatedResponse<EligibilityRule>,
  })
}

// ─── Campus France Prep ─────────────────────────────────────

interface UseCampusFrancePrepsParams extends PaginationParams {
  search?: string
  category?: string
}

export function useCampusFrancePreps(params: UseCampusFrancePrepsParams = {}) {
  return useQuery({
    queryKey: ['catalog', 'campus-france-prep', params],
    queryFn: () =>
      api.get('/catalog/campus-france-prep', { params }) as unknown as PaginatedResponse<CampusFrancePrep>,
  })
}
