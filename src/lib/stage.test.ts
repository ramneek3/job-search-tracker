import { describe, expect, it } from 'vitest'
import { makeApp } from '@/test/factories'
import { stageChangePatch, stagesReached, toISODate } from './stage'

const now = new Date('2026-10-20T15:00:00')

describe('stageChangePatch', () => {
  it('returns an empty patch when the stage does not change', () => {
    expect(stageChangePatch(makeApp({ stage: 'applied' }), 'applied', now)).toEqual({})
  })

  it('appends to history instead of replacing it', () => {
    const app = makeApp({ stage: 'applied' })
    const patch = stageChangePatch(app, 'interview', now)
    expect(patch.stage).toBe('interview')
    expect(patch.history).toEqual([...app.history, { stage: 'interview', at: now.toISOString() }])
  })

  it('fills in the applied date when leaving the wishlist', () => {
    const app = makeApp({ stage: 'wishlist', appliedAt: '' })
    expect(stageChangePatch(app, 'applied', now).appliedAt).toBe('2026-10-20')
  })

  it('keeps an existing applied date', () => {
    const app = makeApp({ stage: 'wishlist', appliedAt: '2026-09-01' })
    expect(stageChangePatch(app, 'applied', now)).not.toHaveProperty('appliedAt')
  })
})

describe('stagesReached', () => {
  it('includes every historical stage and the current one', () => {
    const app = makeApp({
      stage: 'rejected',
      history: [
        { stage: 'applied', at: '' },
        { stage: 'interview', at: '' },
      ],
    })
    expect([...stagesReached(app)].sort()).toEqual(['applied', 'interview', 'rejected'])
  })
})

describe('toISODate', () => {
  it('formats in local time with zero padding', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
