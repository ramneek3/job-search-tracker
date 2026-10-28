import { describe, expect, it } from 'vitest'
import { cn, daysBetween, formatDate, parseLocalDate, pluralize } from './utils'

describe('utils', () => {
  it('merges conflicting Tailwind classes, last one wins', () => {
    const hidden = false as boolean
    expect(cn('h-9 w-9', hidden && 'hidden', 'size-7')).toBe('size-7')
  })

  it('parses YYYY-MM-DD as a local date (no timezone shift)', () => {
    const d = parseLocalDate('2026-03-04')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 4])
  })

  it('formats dates, omitting the year for the current one', () => {
    expect(formatDate('')).toBe('—')
    expect(formatDate(`${new Date().getFullYear()}-03-04`)).not.toMatch(/\d{4}/)
    expect(formatDate('2019-03-04')).toMatch(/2019/)
  })

  it('counts calendar days regardless of time of day', () => {
    expect(daysBetween(new Date('2026-10-01T23:00:00'), new Date('2026-10-02T01:00:00'))).toBe(1)
  })

  it('pluralizes', () => {
    expect(pluralize(1, 'row')).toBe('1 row')
    expect(pluralize(2000, 'row')).toBe('2,000 rows')
  })
})
