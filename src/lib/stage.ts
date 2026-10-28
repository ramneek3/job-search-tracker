import type { Application, ApplicationPatch, Stage } from './schema'

/**
 * Builds the patch for moving an application to a new stage, appending to its
 * stage history so analytics can tell "reached interview, then rejected" apart
 * from "rejected straight after applying".
 */
export function stageChangePatch(
  app: Pick<Application, 'stage' | 'history' | 'appliedAt'>,
  stage: Stage,
  now: Date = new Date(),
): ApplicationPatch {
  if (app.stage === stage) return {}
  const patch: ApplicationPatch = {
    stage,
    history: [...app.history, { stage, at: now.toISOString() }],
  }
  // Moving out of the wishlist means you applied today unless you said otherwise.
  if (app.stage === 'wishlist' && stage !== 'wishlist' && !app.appliedAt) {
    patch.appliedAt = toISODate(now)
  }
  return patch
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Every stage this application has ever been in, including its current one. */
export function stagesReached(app: Pick<Application, 'stage' | 'history'>): Set<Stage> {
  const set = new Set<Stage>(app.history.map((e) => e.stage))
  set.add(app.stage)
  return set
}
