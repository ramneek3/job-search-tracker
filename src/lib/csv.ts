import { applicationInputSchema, type Application, type ApplicationInput } from './schema'

export const CSV_COLUMNS = [
  'company',
  'role',
  'stage',
  'source',
  'url',
  'location',
  'compensation',
  'appliedAt',
  'deadline',
  'followUpAt',
  'contactName',
  'contactEmail',
  'notes',
] as const satisfies readonly (keyof ApplicationInput)[]

function escapeCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCSV(apps: Application[]): string {
  const rows = apps.map((a) => CSV_COLUMNS.map((c) => escapeCell(a[c])).join(','))
  return [CSV_COLUMNS.join(','), ...rows].join('\r\n')
}

/** RFC 4180 parser: handles quoted fields, escaped quotes and newlines inside quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export interface ImportResult {
  valid: ApplicationInput[]
  errors: { line: number; message: string }[]
}

const normalize = (h: string) =>
  h
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

/** Parses a CSV export (ours or a hand-made one) and validates every row. */
export function importCSV(text: string): ImportResult {
  const [header, ...body] = parseCSV(text)
  if (!header) return { valid: [], errors: [{ line: 1, message: 'The file is empty' }] }

  const byName = new Map(CSV_COLUMNS.map((c) => [normalize(c), c]))
  const columns = header.map((h) => byName.get(normalize(h)))
  if (!columns.includes('company') || !columns.includes('role')) {
    return {
      valid: [],
      errors: [{ line: 1, message: 'Missing required "company" and "role" columns' }],
    }
  }

  const result: ImportResult = { valid: [], errors: [] }
  body.forEach((cells, i) => {
    const record: Record<string, string> = { stage: 'wishlist', source: 'other' }
    columns.forEach((col, j) => {
      const v = cells[j]?.trim()
      if (col && v) record[col] = v.replace(/^'(?=[=+\-@])/, '')
    })
    const parsed = applicationInputSchema.safeParse(record)
    if (parsed.success) result.valid.push(parsed.data)
    else {
      const issue = parsed.error.issues[0]!
      result.errors.push({
        line: i + 2,
        message: `${issue.path.join('.') || 'row'}: ${issue.message}`,
      })
    }
  })
  return result
}
