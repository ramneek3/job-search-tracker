import { describe, expect, it } from 'vitest'
import { EMPTY_INPUT } from './application'
import { applicationInputSchema } from './schema'

const valid = {
  ...EMPTY_INPUT,
  company: 'Stripe',
  role: 'Frontend Intern',
  appliedAt: '2026-10-01',
}
const errorsFor = (input: unknown) => {
  const r = applicationInputSchema.safeParse(input)
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('applicationInputSchema', () => {
  it('accepts a minimal valid application', () => {
    expect(applicationInputSchema.safeParse(valid).success).toBe(true)
  })

  it('trims text and requires company and role', () => {
    expect(errorsFor({ ...valid, company: '   ', role: '' })).toMatchObject({
      company: 'Company is required',
      role: 'Role is required',
    })
    expect(applicationInputSchema.parse({ ...valid, company: '  Figma ' }).company).toBe('Figma')
  })

  it('treats empty optional fields as unset but validates filled ones', () => {
    expect(applicationInputSchema.safeParse({ ...valid, url: '', contactEmail: '' }).success).toBe(
      true,
    )
    expect(errorsFor({ ...valid, url: 'not a url', contactEmail: 'nope' })).toMatchObject({
      url: expect.stringContaining('full URL'),
      contactEmail: 'Enter a valid email',
    })
  })

  it('rejects malformed and impossible dates', () => {
    expect(errorsFor({ ...valid, followUpAt: '10/01/2026' })).toHaveProperty('followUpAt')
    expect(errorsFor({ ...valid, followUpAt: '2026-13-45' })).toHaveProperty('followUpAt')
  })

  it('requires an applied date unless the role is still in the wishlist', () => {
    expect(errorsFor({ ...valid, appliedAt: '' })).toHaveProperty('appliedAt')
    expect(
      applicationInputSchema.safeParse({ ...valid, stage: 'wishlist', appliedAt: '' }).success,
    ).toBe(true)
  })

  it('rejects unknown stages', () => {
    expect(errorsFor({ ...valid, stage: 'hired' })).toHaveProperty('stage')
  })
})
