import { describe, it, expect } from 'vitest'
import { joinFullName } from '../src/lib/names.js'

describe('joinFullName', () => {
  it('joins first and last with a single space', () => {
    expect(joinFullName('Sarah', 'Martin')).toBe('Sarah Martin')
  })

  it('collapses internal whitespace from dirty data', () => {
    // Regression: the `info@learninfrance.com` admin user rendered as
    // "Learn in  France" in email subjects because its firstName or
    // lastName contained a trailing / leading space. Naive
    // `${first} ${last}`.trim() only strips edges, not middle.
    expect(joinFullName('Learn in ', 'France')).toBe('Learn in France')
    expect(joinFullName('Learn in', ' France')).toBe('Learn in France')
    expect(joinFullName('Learn in  ', '  France')).toBe('Learn in France')
  })

  it('handles nulls and undefined cleanly', () => {
    expect(joinFullName(null, 'Martin')).toBe('Martin')
    expect(joinFullName('Sarah', null)).toBe('Sarah')
    expect(joinFullName(undefined, undefined)).toBe('')
  })

  it('returns fallback when both names are empty or whitespace', () => {
    expect(joinFullName('', '', 'your counsellor')).toBe('your counsellor')
    expect(joinFullName('  ', '  ', 'a new student')).toBe('a new student')
    expect(joinFullName(null, null, 'fallback')).toBe('fallback')
  })

  it('returns empty string when no fallback is given and names are empty', () => {
    expect(joinFullName('', '')).toBe('')
  })
})
