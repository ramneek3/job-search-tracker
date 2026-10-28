import { describe, expect, it } from 'vitest'
import { makeApp } from '@/test/factories'
import { importCSV, parseCSV, toCSV } from './csv'

describe('parseCSV', () => {
  it('handles quotes, escaped quotes, commas and newlines inside cells', () => {
    expect(parseCSV('a,b\r\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ])
  })

  it('strips a BOM and skips blank lines', () => {
    expect(parseCSV('﻿a\n\n1\n')).toEqual([['a'], ['1']])
  })
})

describe('toCSV / importCSV', () => {
  it('round-trips an export', () => {
    const app = makeApp({
      company: 'Acme, Inc.',
      notes: 'Line 1\nLine "2"',
      stage: 'interview',
      source: 'referral',
    })
    const { valid, errors } = importCSV(toCSV([app]))
    expect(errors).toEqual([])
    expect(valid[0]).toMatchObject({
      company: 'Acme, Inc.',
      notes: 'Line 1\nLine "2"',
      stage: 'interview',
      source: 'referral',
    })
  })

  it('neutralises spreadsheet formulas on export and restores them on import', () => {
    const csv = toCSV([makeApp({ company: '=HYPERLINK("evil")' })])
    expect(csv).toContain(`"'=HYPERLINK(""evil"")"`)
    expect(importCSV(csv).valid[0]!.company).toBe('=HYPERLINK("evil")')
  })

  it('accepts loose headers, fills defaults and reports bad rows by line', () => {
    const { valid, errors } = importCSV(
      'Company,Role,Applied At\nStripe,Intern,\nFigma,,2026-01-01\n',
    )
    expect(valid).toEqual([
      expect.objectContaining({ company: 'Stripe', stage: 'wishlist', source: 'other' }),
    ])
    expect(errors).toEqual([{ line: 3, message: 'role: Role is required' }])
  })

  it('rejects files without the required columns', () => {
    expect(importCSV('name,title\nx,y').errors[0]!.message).toMatch(/company/)
    expect(importCSV('').errors[0]!.message).toMatch(/empty/)
  })
})
