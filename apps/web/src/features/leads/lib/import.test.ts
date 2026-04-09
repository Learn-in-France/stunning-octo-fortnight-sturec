import { describe, expect, it } from 'vitest'

import { parseLeadImportCsv } from './import'

describe('parseLeadImportCsv', () => {
  it('parses expected lead columns and applies a default source partner', () => {
    const csv = [
      'email,first_name,last_name,phone,notes',
      'alice@example.com,Alice,Martin,+33123456789,"Interested in CS"',
      'bob@example.com,Bob,,,+ follow up',
    ].join('\n')

    const result = parseLeadImportCsv(csv, { sourcePartner: 'Sorbonne' })

    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Martin',
      phone: '+33123456789',
      sourcePartner: 'Sorbonne',
      notes: 'Interested in CS',
    })
    expect(result.rows[1].sourcePartner).toBe('Sorbonne')
  })

  it('returns validation errors for unsupported columns and missing email values', () => {
    const csv = [
      'email,course',
      ',MBA',
    ].join('\n')

    const result = parseLeadImportCsv(csv)

    expect(result.rows).toEqual([])
    expect(result.errors).toContain('Unsupported columns: course')
  })
})
