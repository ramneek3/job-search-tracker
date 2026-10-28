import { describe, expect, it } from 'vitest'
import { positionAtIndex, positionBetween } from './position'

describe('positionBetween', () => {
  it('handles empty, start, end and middle', () => {
    expect(positionBetween()).toBe(1024)
    expect(positionBetween(undefined, 1024)).toBe(0)
    expect(positionBetween(1024, undefined)).toBe(2048)
    expect(positionBetween(1024, 2048)).toBe(1536)
  })

  it('always lands strictly between its neighbours, even after many inserts', () => {
    let lo = 0
    const hi = 1
    for (let i = 0; i < 40; i++) {
      const p = positionBetween(lo, hi)
      expect(p).toBeGreaterThan(lo)
      expect(p).toBeLessThan(hi)
      lo = p
    }
  })
})

describe('positionAtIndex', () => {
  const column = [{ position: 100 }, { position: 200 }, { position: 300 }]
  it('places a card at the top, middle or bottom of a column', () => {
    expect(positionAtIndex(column, 0)).toBeLessThan(100)
    expect(positionAtIndex(column, 1)).toBe(150)
    expect(positionAtIndex(column, 3)).toBeGreaterThan(300)
  })
})
