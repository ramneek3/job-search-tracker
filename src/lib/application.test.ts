import { describe, expect, it } from 'vitest'
import { makeApp } from '@/test/factories'
import { EMPTY_INPUT, buildApplication, toInput } from './application'

const now = new Date('2026-10-28T12:00:00Z')

describe('buildApplication', () => {
  it('puts a new card at the top of its column', () => {
    const existing = [
      makeApp({ stage: 'applied', position: 500 }),
      makeApp({ stage: 'offer', position: -9000 }),
    ]
    const app = buildApplication(
      { ...EMPTY_INPUT, company: 'X', role: 'Y', stage: 'applied' },
      existing,
      now,
      'id-1',
    )
    expect(app).toMatchObject({ id: 'id-1', position: 500 - 1024, createdAt: now.toISOString() })
  })

  it('backfills an Applied event when logging something already past that stage', () => {
    const app = buildApplication(
      { ...EMPTY_INPUT, company: 'X', role: 'Y', stage: 'interview', appliedAt: '2026-10-01' },
      [],
      now,
    )
    expect(app.history.map((e) => e.stage)).toEqual(['applied', 'interview'])
  })
})

describe('toInput', () => {
  it('strips server-managed fields', () => {
    expect(Object.keys(toInput(makeApp())).sort()).toEqual(Object.keys(EMPTY_INPUT).sort())
  })
})
