import type { Application } from '@/lib/schema'

let n = 0

export function makeApp(overrides: Partial<Application> = {}): Application {
  n++
  return {
    id: `app-${n}`,
    company: `Company ${n}`,
    role: 'Frontend Intern',
    stage: 'applied',
    source: 'linkedin',
    url: '',
    location: 'Remote',
    compensation: '',
    appliedAt: '2026-10-01',
    deadline: '',
    followUpAt: '',
    contactName: '',
    contactEmail: '',
    notes: '',
    position: n * 1024,
    history: [{ stage: overrides.stage ?? 'applied', at: '2026-10-01T12:00:00.000Z' }],
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  }
}

/** History helper: `path('2026-10-01', ['applied', 0], ['oa', 5])` → events N days after the start. */
export function path(
  start: string,
  ...steps: [Application['stage'], number][]
): Application['history'] {
  const base = new Date(`${start}T12:00:00`)
  return steps.map(([stage, days]) => ({
    stage,
    at: new Date(base.getTime() + days * 86_400_000).toISOString(),
  }))
}
