export interface LeadImportRow {
  email: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  phone?: string
  sourcePartner?: string
  notes?: string
}

export interface ParsedLeadImport {
  rows: LeadImportRow[]
  errors: string[]
}

const SUPPORTED_HEADERS = new Set([
  'email',
  'firstname',
  'first_name',
  'lastname',
  'last_name',
  'phone',
  'sourcepartner',
  'source_partner',
  'notes',
])

export function parseLeadImportCsv(
  content: string,
  defaults: { sourcePartner?: string } = {},
): ParsedLeadImport {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ['CSV must include a header row and at least one data row.'],
    }
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  const unknownHeaders = headers.filter((header) => header && !SUPPORTED_HEADERS.has(header))
  const errors: string[] = []

  if (!headers.includes('email')) {
    errors.push('CSV must include an email column.')
  }
  if (unknownHeaders.length > 0) {
    errors.push(`Unsupported columns: ${unknownHeaders.join(', ')}`)
  }
  if (errors.length > 0) return { rows: [], errors }

  const rows: LeadImportRow[] = []

  for (let index = 1; index < lines.length; index++) {
    const values = splitCsvLine(lines[index])
    const record: Record<string, string> = {}

    headers.forEach((header, headerIndex) => {
      if (!header) return
      record[header] = (values[headerIndex] ?? '').trim()
    })

    const email = record.email?.toLowerCase()
    if (!email) {
      errors.push(`Row ${index + 1}: email is required.`)
      continue
    }
    if (!isLikelyEmail(email)) {
      errors.push(`Row ${index + 1}: invalid email "${record.email}".`)
      continue
    }

    rows.push({
      email,
      firstName: record.firstname || record.first_name || undefined,
      first_name: record.first_name || undefined,
      lastName: record.lastname || record.last_name || undefined,
      last_name: record.last_name || undefined,
      phone: record.phone || undefined,
      sourcePartner: record.sourcepartner || record.source_partner || defaults.sourcePartner || undefined,
      notes: record.notes || undefined,
    })
  }

  return { rows, errors }
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_')
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
