import type { Application, ApplicationInput, StageEvent } from './schema'
import { parseLocalDate } from './utils'

/** Builds a full record for a brand-new application, placed at the top of its column. */
export function buildApplication(
  input: ApplicationInput,
  existing: Pick<Application, 'stage' | 'position'>[],
  now = new Date(),
  id: string = crypto.randomUUID(),
): Application {
  const column = existing.filter((a) => a.stage === input.stage)
  const top = column.length ? Math.min(...column.map((a) => a.position)) : 1024
  const ts = now.toISOString()

  const history: StageEvent[] = []
  if (input.appliedAt && input.stage !== 'applied' && input.stage !== 'wishlist') {
    // Logged after the fact: record that it was submitted on the given date.
    history.push({ stage: 'applied', at: parseLocalDate(input.appliedAt).toISOString() })
  }
  history.push({ stage: input.stage, at: ts })

  return {
    ...input,
    id,
    position: column.length ? top - 1024 : top,
    history,
    createdAt: ts,
    updatedAt: ts,
  }
}

export const EMPTY_INPUT: ApplicationInput = {
  company: '',
  role: '',
  stage: 'applied',
  source: 'linkedin',
  url: '',
  location: '',
  compensation: '',
  appliedAt: '',
  deadline: '',
  followUpAt: '',
  contactName: '',
  contactEmail: '',
  notes: '',
}

export function toInput(app: Application): ApplicationInput {
  const { id: _id, position: _p, history: _h, createdAt: _c, updatedAt: _u, ...input } = app
  return { ...EMPTY_INPUT, ...input }
}
