import { STAGES } from '@/lib/constants'
import type { Application, Stage } from '@/lib/schema'

export type Columns = Record<Stage, string[]>

/** Application ids per stage, ordered by board position. */
export function groupByStage(apps: Application[]): Columns {
  const cols = Object.fromEntries(STAGES.map((s) => [s, [] as Application[]])) as Record<
    Stage,
    Application[]
  >
  for (const a of apps) cols[a.stage].push(a)
  return Object.fromEntries(
    STAGES.map((s) => [s, cols[s].sort((a, b) => a.position - b.position).map((a) => a.id)]),
  ) as Columns
}
