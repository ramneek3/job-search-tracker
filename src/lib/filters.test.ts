import { describe, expect, it } from 'vitest'
import { makeApp } from '@/test/factories'
import {
  EMPTY_FILTERS,
  filterApplications,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
} from './filters'

describe('URL filter state', () => {
  it('round-trips through the query string', () => {
    const f = {
      q: 'react',
      stages: ['interview', 'offer'] as const,
      sources: ['referral'] as const,
      sort: { field: 'appliedAt' as const, desc: true },
    }
    const params = serializeFilters({ ...f, stages: [...f.stages], sources: [...f.sources] })
    expect(params.toString()).toBe(
      'q=react&stage=interview%2Coffer&source=referral&sort=appliedAt.desc',
    )
    expect(parseFilters(params)).toEqual({ ...f, stages: [...f.stages], sources: [...f.sources] })
  })

  it('drops unknown values from hand-edited URLs', () => {
    const f = parseFilters(new URLSearchParams('stage=offer,hired&source=myspace&sort=salary.desc'))
    expect(f).toEqual({ ...EMPTY_FILTERS, stages: ['offer'] })
  })

  it('omits defaults and preserves unrelated params', () => {
    const p = serializeFilters(EMPTY_FILTERS, new URLSearchParams('app=123&q=old'))
    expect(p.toString()).toBe('app=123')
  })

  it('knows when anything is filtered', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: '  ' })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sources: ['indeed'] })).toBe(true)
  })
})

describe('filterApplications', () => {
  const apps = [
    makeApp({ company: 'Stripe', stage: 'applied', source: 'linkedin' }),
    makeApp({ company: 'Figma', stage: 'interview', source: 'referral', notes: 'Loves React' }),
    makeApp({ company: 'Shopify', stage: 'offer', source: 'referral' }),
  ]

  it('searches across company, role and notes, case-insensitively', () => {
    expect(
      filterApplications(apps, { ...EMPTY_FILTERS, q: 'REACT' }).map((a) => a.company),
    ).toEqual(['Figma'])
  })

  it('combines stage and source filters with AND', () => {
    const r = filterApplications(apps, {
      ...EMPTY_FILTERS,
      stages: ['interview', 'offer'],
      sources: ['referral'],
    })
    expect(r.map((a) => a.company)).toEqual(['Figma', 'Shopify'])
  })
})
