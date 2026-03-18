export interface University {
  id: string
  name: string
  city: string
  country: string
  websiteUrl: string | null
  partnerStatus: string | null
  notes: string | null
  active: boolean
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface Program {
  id: string
  universityId: string
  name: string
  degreeLevel: string
  fieldOfStudy: string
  language: string
  durationMonths: number
  tuitionAmount: number
  tuitionCurrency: string
  minimumGpa: number | null
  englishRequirementType: string | null
  englishMinimumScore: number | null
  description: string | null
  active: boolean
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface ProgramIntake {
  id: string
  programId: string
  intakeName: string
  startMonth: number
  startYear: number
  applicationDeadline: string | null
  active: boolean
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export type ValueType = 'number' | 'string' | 'boolean' | 'enum'

export interface EligibilityRule {
  id: string
  programId: string | null
  ruleName: string
  field: string
  operator: string
  value: string
  valueType: ValueType
  ruleScope: string | null
  description: string | null
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface VisaRequirement {
  id: string
  title: string
  description: string
  documentType: string
  required: boolean
  countrySpecific: string | null
  stageApplicable: string | null
  sortOrder: number
  createdBy: string
  updatedBy: string | null
}

export interface CampusFrancePrep {
  id: string
  title: string
  content: string
  category: string
  sortOrder: number
  active: boolean
  createdBy: string
  updatedBy: string | null
}
