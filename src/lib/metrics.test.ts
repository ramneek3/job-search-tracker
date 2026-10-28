import { describe, expect, it } from 'vitest'
import { makeApp, path } from '@/test/factories'
import {
  bySource,
  computeFunnel,
  daysToResponse,
  dueSoon,
  furthestStage,
  median,
  startOfWeek,
  summarize,
  weeklyActivity,
} from './metrics'
import { STAGE_ORDER } from './constants'

const ghosted = makeApp({
  stage: 'applied',
  source: 'linkedin',
  appliedAt: '2026-10-01',
  history: path('2026-10-01', ['applied', 0]),
})
const rejectedAfterInterview = makeApp({
  stage: 'rejected',
  source: 'referral',
  appliedAt: '2026-10-01',
  history: path('2026-10-01', ['applied', 0], ['interview', 4], ['rejected', 10]),
})
const offer = makeApp({
  stage: 'offer',
  source: 'referral',
  appliedAt: '2026-10-01',
  history: path('2026-10-01', ['applied', 0], ['oa', 2], ['interview', 8], ['offer', 15]),
})
const wishlist = makeApp({
  stage: 'wishlist',
  appliedAt: '',
  history: path('2026-10-01', ['wishlist', 0]),
})
const apps = [ghosted, rejectedAfterInterview, offer, wishlist]

describe('furthestStage', () => {
  it('remembers how far a rejected application got', () => {
    expect(furthestStage(rejectedAfterInterview)).toBe(STAGE_ORDER.interview)
  })
  it('counts an application logged straight into Rejected as applied', () => {
    const r = makeApp({
      stage: 'rejected',
      appliedAt: '2026-10-01',
      history: path('2026-10-01', ['rejected', 3]),
    })
    expect(furthestStage(r)).toBe(STAGE_ORDER.applied)
  })
})

describe('summarize', () => {
  it('computes headline numbers, excluding the wishlist from rates', () => {
    expect(summarize(apps)).toEqual({
      total: 4,
      applied: 3,
      responded: 2,
      responseRate: 2 / 3,
      interviews: 2,
      offers: 1,
      medianDaysToResponse: 3, // first replies after 4 and 2 days
    })
  })

  it('handles an empty list without dividing by zero', () => {
    expect(summarize([])).toMatchObject({ responseRate: 0, medianDaysToResponse: null })
  })
})

describe('daysToResponse', () => {
  it('is null without a reply or applied date', () => {
    expect(daysToResponse(ghosted)).toBeNull()
    expect(daysToResponse(wishlist)).toBeNull()
  })
})

describe('median', () => {
  it('handles odd, even and empty inputs', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
  })
})

describe('computeFunnel', () => {
  it('counts applications that reached at least each stage', () => {
    expect(computeFunnel(apps).map((s) => [s.stage, s.count])).toEqual([
      ['applied', 3],
      ['oa', 2], // an OA is optional: reaching interview implies passing this step
      ['interview', 2],
      ['offer', 1],
    ])
    expect(computeFunnel(apps)[3]!.ofApplied).toBeCloseTo(1 / 3)
  })
})

describe('bySource', () => {
  it('ranks sources by response rate and hides unused ones', () => {
    expect(bySource(apps).map((s) => [s.source, s.applied, s.responseRate])).toEqual([
      ['referral', 2, 1],
      ['linkedin', 1, 0],
    ])
  })
})

describe('weeklyActivity', () => {
  it('starts weeks on Monday', () => {
    expect(startOfWeek(new Date('2026-10-25T10:00:00')).getDay()).toBe(1) // Sunday → previous Monday
  })

  it('buckets applications into the last N weeks', () => {
    const now = new Date('2026-10-28T12:00:00') // Wednesday
    const weeks = weeklyActivity(
      [
        makeApp({ appliedAt: '2026-10-26' }),
        makeApp({ appliedAt: '2026-10-28' }),
        makeApp({ appliedAt: '2026-10-20' }),
        makeApp({ appliedAt: '2025-01-01' }),
      ],
      now,
      3,
    )
    expect(weeks).toEqual([
      { weekStart: '2026-10-12', count: 0 },
      { weekStart: '2026-10-19', count: 1 },
      { weekStart: '2026-10-26', count: 2 },
    ])
  })
})

describe('dueSoon', () => {
  const now = new Date('2026-10-28T09:00:00')
  it('lists overdue and upcoming follow-ups, soonest first, skipping closed applications', () => {
    const due = dueSoon(
      [
        makeApp({ company: 'Later', followUpAt: '2026-11-02' }),
        makeApp({ company: 'Overdue', followUpAt: '2026-10-25' }),
        makeApp({ company: 'Too far', followUpAt: '2026-12-01' }),
        makeApp({ company: 'Closed', stage: 'rejected', followUpAt: '2026-10-28' }),
        makeApp({ company: 'Deadline', stage: 'wishlist', deadline: '2026-10-29' }),
        makeApp({ company: 'Applied deadline', stage: 'applied', deadline: '2026-10-29' }),
      ],
      now,
    )
    expect(due.map((d) => [d.app.company, d.kind, d.inDays])).toEqual([
      ['Overdue', 'follow-up', -3],
      ['Deadline', 'deadline', 1],
      ['Later', 'follow-up', 5],
    ])
  })
})
