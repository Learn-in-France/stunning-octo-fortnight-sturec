import { describe, it, expect } from 'vitest'

import {
  FIXTURE_ADMIN_USER,
  FIXTURE_COUNSELLOR_USER,
  FIXTURE_STUDENT_USER,
  FIXTURE_LEAD_LIST_ITEM,
  FIXTURE_LEAD_DETAIL,
  FIXTURE_IMPORTED_LEAD,
  FIXTURE_STUDENT_LIST_ITEM,
  FIXTURE_STUDENT_DETAIL,
  FIXTURE_STUDENT_OWN_PROFILE,
  FIXTURE_STUDENT_PROGRESS,
  FIXTURE_AI_ASSESSMENT,
  FIXTURE_APPLICATION,
  FIXTURE_DOCUMENTS,
  FIXTURE_DOCUMENT_REQUIREMENTS,
  FIXTURE_TEAM_MEMBER,
  FIXTURE_ACTIVITY_LOG,
  FIXTURE_TIMELINE_ITEM,
  FIXTURE_NOTE,
  FIXTURE_CONTACT,
  FIXTURE_CONSENT_EVENT,
  FIXTURE_BOOKING,
  FIXTURE_CHAT_SESSION,
  FIXTURE_CHAT_MESSAGE,
  FIXTURE_CHAT_MESSAGE_RESPONSE,
  FIXTURE_NOTIFICATION,
  FIXTURE_UNIVERSITY,
  FIXTURE_PROGRAM,
  FIXTURE_PROGRAM_INTAKE,
  FIXTURE_ASSIGNMENT,
  FIXTURE_ANALYTICS_OVERVIEW,
  FIXTURE_PIPELINE_METRICS,
  FIXTURE_COUNSELLOR_ANALYTICS_ITEM,
  FIXTURE_COUNSELLOR_ANALYTICS_DETAIL,
  FIXTURE_STUDENT_ANALYTICS_ITEM,
  FIXTURE_STUDENT_ANALYTICS_DETAIL,
} from '@sturec/shared'

import {
  verifyResponseSchema,
  leadListItemSchema,
  leadDetailSchema,
  studentListItemSchema,
  studentDetailSchema,
  studentOwnProfileSchema,
  studentProgressSchema,
  aiAssessmentSummarySchema,
  applicationListItemSchema,
  documentListItemSchema,
  documentRequirementItemSchema,
  teamMemberItemSchema,
  activityLogItemSchema,
  timelineItemSchema,
  noteItemSchema,
  contactItemSchema,
  consentEventItemSchema,
  bookingListItemSchema,
  chatSessionItemSchema,
  chatMessageItemSchema,
  chatMessageResponseSchema,
  notificationItemSchema,
  universityItemSchema,
  programItemSchema,
  programIntakeItemSchema,
  assignmentHistoryItemSchema,
  analyticsOverviewSchema,
  pipelineMetricsSchema,
  counsellorAnalyticsItemSchema,
  counsellorAnalyticsDetailSchema,
  studentAnalyticsItemSchema,
  studentAnalyticsDetailSchema,
} from '@sturec/shared/validation'

// ─── Auth Fixtures ────────────────────────────────────────────

describe('AuthUserResponse contract', () => {
  it('FIXTURE_ADMIN_USER passes schema', () => {
    expect(verifyResponseSchema.parse(FIXTURE_ADMIN_USER)).toBeDefined()
  })

  it('FIXTURE_COUNSELLOR_USER passes schema', () => {
    expect(verifyResponseSchema.parse(FIXTURE_COUNSELLOR_USER)).toBeDefined()
  })

  it('FIXTURE_STUDENT_USER passes schema', () => {
    expect(verifyResponseSchema.parse(FIXTURE_STUDENT_USER)).toBeDefined()
  })
})

// ─── Lead Fixtures ────────────────────────────────────────────

describe('Lead contract', () => {
  it('FIXTURE_LEAD_LIST_ITEM passes leadListItemSchema', () => {
    expect(leadListItemSchema.parse(FIXTURE_LEAD_LIST_ITEM)).toBeDefined()
  })

  it('FIXTURE_IMPORTED_LEAD passes leadListItemSchema', () => {
    expect(leadListItemSchema.parse(FIXTURE_IMPORTED_LEAD)).toBeDefined()
  })

  it('FIXTURE_LEAD_DETAIL passes leadDetailSchema', () => {
    expect(leadDetailSchema.parse(FIXTURE_LEAD_DETAIL)).toBeDefined()
  })
})

// ─── Student Fixtures ─────────────────────────────────────────

describe('Student contract', () => {
  it('FIXTURE_STUDENT_LIST_ITEM passes studentListItemSchema', () => {
    expect(studentListItemSchema.parse(FIXTURE_STUDENT_LIST_ITEM)).toBeDefined()
  })

  it('FIXTURE_STUDENT_DETAIL passes studentDetailSchema', () => {
    expect(studentDetailSchema.parse(FIXTURE_STUDENT_DETAIL)).toBeDefined()
  })

  it('FIXTURE_STUDENT_OWN_PROFILE passes studentOwnProfileSchema', () => {
    expect(studentOwnProfileSchema.parse(FIXTURE_STUDENT_OWN_PROFILE)).toBeDefined()
  })

  it('FIXTURE_STUDENT_PROGRESS passes studentProgressSchema', () => {
    expect(studentProgressSchema.parse(FIXTURE_STUDENT_PROGRESS)).toBeDefined()
  })
})

// ─── AI Assessment Fixtures ───────────────────────────────────

describe('AiAssessment contract', () => {
  it('FIXTURE_AI_ASSESSMENT passes aiAssessmentSummarySchema', () => {
    expect(aiAssessmentSummarySchema.parse(FIXTURE_AI_ASSESSMENT)).toBeDefined()
  })
})

// ─── Application Fixtures ─────────────────────────────────────

describe('Application contract', () => {
  it('FIXTURE_APPLICATION passes applicationListItemSchema', () => {
    expect(applicationListItemSchema.parse(FIXTURE_APPLICATION)).toBeDefined()
  })
})

// ─── Document Fixtures ────────────────────────────────────────

describe('Document contract', () => {
  it('FIXTURE_DOCUMENTS entries pass documentListItemSchema', () => {
    for (const doc of FIXTURE_DOCUMENTS) {
      expect(documentListItemSchema.parse(doc)).toBeDefined()
    }
  })

  it('FIXTURE_DOCUMENT_REQUIREMENTS entries pass documentRequirementItemSchema', () => {
    for (const req of FIXTURE_DOCUMENT_REQUIREMENTS) {
      expect(documentRequirementItemSchema.parse(req)).toBeDefined()
    }
  })
})

// ─── Team Fixtures ────────────────────────────────────────────

describe('Team contract', () => {
  it('FIXTURE_TEAM_MEMBER passes teamMemberItemSchema', () => {
    expect(teamMemberItemSchema.parse(FIXTURE_TEAM_MEMBER)).toBeDefined()
  })
})

// ─── Activity Log Fixtures ────────────────────────────────────

describe('ActivityLog contract', () => {
  it('FIXTURE_ACTIVITY_LOG passes activityLogItemSchema', () => {
    expect(activityLogItemSchema.parse(FIXTURE_ACTIVITY_LOG)).toBeDefined()
  })
})

// ─── Timeline Fixtures ────────────────────────────────────────

describe('Timeline contract', () => {
  it('FIXTURE_TIMELINE_ITEM passes timelineItemSchema', () => {
    expect(timelineItemSchema.parse(FIXTURE_TIMELINE_ITEM)).toBeDefined()
  })
})

// ─── Note Fixtures ────────────────────────────────────────────

describe('Note contract', () => {
  it('FIXTURE_NOTE passes noteItemSchema', () => {
    expect(noteItemSchema.parse(FIXTURE_NOTE)).toBeDefined()
  })
})

// ─── Contact Fixtures ─────────────────────────────────────────

describe('Contact contract', () => {
  it('FIXTURE_CONTACT passes contactItemSchema', () => {
    expect(contactItemSchema.parse(FIXTURE_CONTACT)).toBeDefined()
  })
})

// ─── Consent Event Fixtures ───────────────────────────────────

describe('ConsentEvent contract', () => {
  it('FIXTURE_CONSENT_EVENT passes consentEventItemSchema', () => {
    expect(consentEventItemSchema.parse(FIXTURE_CONSENT_EVENT)).toBeDefined()
  })
})

// ─── Booking Fixtures ─────────────────────────────────────────

describe('Booking contract', () => {
  it('FIXTURE_BOOKING passes bookingListItemSchema', () => {
    expect(bookingListItemSchema.parse(FIXTURE_BOOKING)).toBeDefined()
  })
})

// ─── Chat Fixtures ────────────────────────────────────────────

describe('Chat contract', () => {
  it('FIXTURE_CHAT_SESSION passes chatSessionItemSchema', () => {
    expect(chatSessionItemSchema.parse(FIXTURE_CHAT_SESSION)).toBeDefined()
  })

  it('FIXTURE_CHAT_MESSAGE passes chatMessageItemSchema', () => {
    expect(chatMessageItemSchema.parse(FIXTURE_CHAT_MESSAGE)).toBeDefined()
  })

  it('FIXTURE_CHAT_MESSAGE_RESPONSE passes chatMessageResponseSchema', () => {
    expect(chatMessageResponseSchema.parse(FIXTURE_CHAT_MESSAGE_RESPONSE)).toBeDefined()
  })

  it('ChatMessageResponse with null options passes schema', () => {
    expect(chatMessageResponseSchema.parse({
      ...FIXTURE_CHAT_MESSAGE_RESPONSE,
      options: null,
    })).toBeDefined()
  })
})

// ─── Notification Fixtures ────────────────────────────────────

describe('Notification contract', () => {
  it('FIXTURE_NOTIFICATION passes notificationItemSchema', () => {
    expect(notificationItemSchema.parse(FIXTURE_NOTIFICATION)).toBeDefined()
  })
})

// ─── Catalog Fixtures ─────────────────────────────────────────

describe('Catalog contract', () => {
  it('FIXTURE_UNIVERSITY passes universityItemSchema', () => {
    expect(universityItemSchema.parse(FIXTURE_UNIVERSITY)).toBeDefined()
  })

  it('FIXTURE_PROGRAM passes programItemSchema', () => {
    expect(programItemSchema.parse(FIXTURE_PROGRAM)).toBeDefined()
  })

  it('FIXTURE_PROGRAM_INTAKE passes programIntakeItemSchema', () => {
    expect(programIntakeItemSchema.parse(FIXTURE_PROGRAM_INTAKE)).toBeDefined()
  })
})

// ─── Assignment Fixtures ──────────────────────────────────────

describe('Assignment contract', () => {
  it('FIXTURE_ASSIGNMENT passes assignmentHistoryItemSchema', () => {
    expect(assignmentHistoryItemSchema.parse(FIXTURE_ASSIGNMENT)).toBeDefined()
  })
})

// ─── Analytics Fixtures ──────────────────────────────────────

describe('Analytics contract', () => {
  it('FIXTURE_ANALYTICS_OVERVIEW passes analyticsOverviewSchema', () => {
    expect(analyticsOverviewSchema.parse(FIXTURE_ANALYTICS_OVERVIEW)).toBeDefined()
  })

  it('FIXTURE_PIPELINE_METRICS passes pipelineMetricsSchema', () => {
    expect(pipelineMetricsSchema.parse(FIXTURE_PIPELINE_METRICS)).toBeDefined()
  })

  it('FIXTURE_COUNSELLOR_ANALYTICS_ITEM passes counsellorAnalyticsItemSchema', () => {
    expect(counsellorAnalyticsItemSchema.parse(FIXTURE_COUNSELLOR_ANALYTICS_ITEM)).toBeDefined()
  })

  it('FIXTURE_COUNSELLOR_ANALYTICS_DETAIL passes counsellorAnalyticsDetailSchema', () => {
    expect(counsellorAnalyticsDetailSchema.parse(FIXTURE_COUNSELLOR_ANALYTICS_DETAIL)).toBeDefined()
  })

  it('FIXTURE_STUDENT_ANALYTICS_ITEM passes studentAnalyticsItemSchema', () => {
    expect(studentAnalyticsItemSchema.parse(FIXTURE_STUDENT_ANALYTICS_ITEM)).toBeDefined()
  })

  it('FIXTURE_STUDENT_ANALYTICS_DETAIL passes studentAnalyticsDetailSchema', () => {
    expect(studentAnalyticsDetailSchema.parse(FIXTURE_STUDENT_ANALYTICS_DETAIL)).toBeDefined()
  })
})
