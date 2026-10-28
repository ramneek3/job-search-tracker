import { describe, expect, it } from 'vitest'
import { makeApp } from '@/test/factories'
import { groupByStage } from './columns'

describe('groupByStage', () => {
  it('groups ids by stage, ordered by position, with every stage present', () => {
    const a = makeApp({ id: 'a', stage: 'applied', position: 3 })
    const b = makeApp({ id: 'b', stage: 'applied', position: 1 })
    const c = makeApp({ id: 'c', stage: 'offer', position: 2 })
    expect(groupByStage([a, b, c])).toEqual({
      wishlist: [],
      applied: ['b', 'a'],
      oa: [],
      interview: [],
      offer: ['c'],
      rejected: [],
    })
  })
})
