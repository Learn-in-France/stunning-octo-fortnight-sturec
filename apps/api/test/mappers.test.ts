import { describe, it, expect } from 'vitest'

import {
  mapLeadStatus,
  mapActivityChannel,
  mapConsentType,
  mapValueType,
} from '../src/lib/mappers/enums.js'

// ─── Enum Mapper Tests ───────────────────────────────────────

describe('mapLeadStatus', () => {
  it('maps new_lead → new', () => {
    expect(mapLeadStatus('new_lead')).toBe('new')
  })

  it('passes through non-divergent values', () => {
    expect(mapLeadStatus('nurturing')).toBe('nurturing')
    expect(mapLeadStatus('qualified')).toBe('qualified')
    expect(mapLeadStatus('disqualified')).toBe('disqualified')
    expect(mapLeadStatus('converted')).toBe('converted')
  })
})

describe('mapActivityChannel', () => {
  it('maps whatsapp_channel → whatsapp', () => {
    expect(mapActivityChannel('whatsapp_channel')).toBe('whatsapp')
  })

  it('maps email_channel → email', () => {
    expect(mapActivityChannel('email_channel')).toBe('email')
  })

  it('passes through non-divergent values', () => {
    expect(mapActivityChannel('phone')).toBe('phone')
    expect(mapActivityChannel('video')).toBe('video')
    expect(mapActivityChannel('in_person')).toBe('in_person')
    expect(mapActivityChannel('internal')).toBe('internal')
    expect(mapActivityChannel('other')).toBe('other')
  })
})

describe('mapConsentType', () => {
  it('maps whatsapp_consent → whatsapp', () => {
    expect(mapConsentType('whatsapp_consent')).toBe('whatsapp')
  })

  it('maps email_consent → email', () => {
    expect(mapConsentType('email_consent')).toBe('email')
  })

  it('passes through parent_contact', () => {
    expect(mapConsentType('parent_contact')).toBe('parent_contact')
  })
})

describe('mapValueType', () => {
  it('maps enum_type → enum', () => {
    expect(mapValueType('enum_type')).toBe('enum')
  })

  it('passes through non-divergent values', () => {
    expect(mapValueType('number')).toBe('number')
    expect(mapValueType('string')).toBe('string')
    expect(mapValueType('boolean')).toBe('boolean')
  })
})
