import { SOURCES, SOURCE_LABELS, STAGE_LABELS, STAGE_ORDER } from './constants'
import type { Application, Source, Stage } from './schema'
import { stagesReached, toISODate } from './stage'
import { daysBetween, parseLocalDate } from './utils'

const PROGRESS: Stage[] = ['applied', 'oa', 'interview', 'offer']
const RESPONSE_STAGES: Stage[] = ['oa', 'interview', 'offer', 'rejected']

export function hasApplied(app: Application): boolean {
  return !!app.appliedAt || [...stagesReached(app)].some((s) => s !== 'wishlist')
}

export function hasResponse(app: Application): boolean {
  const reached = stagesReached(app)
  return RESPONSE_STAGES.some((s) => reached.has(s))
}

/** Furthest stage on the happy path this application ever reached. */
export function furthestStage(app: Application): number {
  let max = hasApplied(app) ? STAGE_ORDER.applied : STAGE_ORDER.wishlist
  for (const s of stagesReached(app)) if (s !== 'rejected') max = Math.max(max, STAGE_ORDER[s])
  return max
}

const rate = (n: number, d: number) => (d === 0 ? 0 : n / d)

export interface Summary {
  total: number
  applied: number
  responded: number
  responseRate: number
  interviews: number
  offers: number
  medianDaysToResponse: number | null
}

export function summarize(apps: Application[]): Summary {
  const applied = apps.filter(hasApplied)
  const responded = applied.filter(hasResponse)
  return {
    total: apps.length,
    applied: applied.length,
    responded: responded.length,
    responseRate: rate(responded.length, applied.length),
    interviews: apps.filter((a) => furthestStage(a) >= STAGE_ORDER.interview).length,
    offers: apps.filter((a) => furthestStage(a) >= STAGE_ORDER.offer).length,
    medianDaysToResponse: median(
      responded.map(daysToResponse).filter((d): d is number => d !== null),
    ),
  }
}

/** Days from the application date to the first response, or null if unknown. */
export function daysToResponse(app: Application): number | null {
  if (!app.appliedAt) return null
  const first = app.history.find((e) => RESPONSE_STAGES.includes(e.stage))
  if (!first) return null
  return Math.max(0, daysBetween(parseLocalDate(app.appliedAt), new Date(first.at)))
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

export interface FunnelStep {
  stage: Stage
  label: string
  count: number
  /** Share of all submitted applications that got at least this far. */
  ofApplied: number
}

export function computeFunnel(apps: Application[]): FunnelStep[] {
  const progress = apps.filter(hasApplied).map(furthestStage)
  const applied = progress.length
  return PROGRESS.map((stage) => {
    const count = progress.filter((p) => p >= STAGE_ORDER[stage]).length
    return { stage, label: STAGE_LABELS[stage], count, ofApplied: rate(count, applied) }
  })
}

export interface SourceStat {
  source: Source
  label: string
  applied: number
  responded: number
  responseRate: number
}

export function bySource(apps: Application[]): SourceStat[] {
  return SOURCES.map((source) => {
    const applied = apps.filter((a) => a.source === source && hasApplied(a))
    const responded = applied.filter(hasResponse).length
    return {
      source,
      label: SOURCE_LABELS[source],
      applied: applied.length,
      responded,
      responseRate: rate(responded, applied.length),
    }
  })
    .filter((s) => s.applied > 0)
    .sort((a, b) => b.responseRate - a.responseRate || b.applied - a.applied)
}

/** Monday of the week containing `d`, at local midnight. */
export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

export interface WeekBucket {
  weekStart: string // YYYY-MM-DD
  count: number
}

export function weeklyActivity(apps: Application[], now = new Date(), weeks = 12): WeekBucket[] {
  const thisWeek = startOfWeek(now)
  const buckets: WeekBucket[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisWeek)
    d.setDate(d.getDate() - i * 7)
    buckets.push({ weekStart: toISODate(d), count: 0 })
  }
  const index = new Map(buckets.map((b, i) => [b.weekStart, i]))
  for (const a of apps) {
    if (!a.appliedAt) continue
    const i = index.get(toISODate(startOfWeek(parseLocalDate(a.appliedAt))))
    if (i !== undefined) buckets[i]!.count++
  }
  return buckets
}

export interface DueItem {
  app: Application
  kind: 'follow-up' | 'deadline'
  date: string
  /** Negative = overdue. */
  inDays: number
}

/** Follow-ups and deadlines that are overdue or due within `withinDays`, for open applications. */
export function dueSoon(apps: Application[], now = new Date(), withinDays = 7): DueItem[] {
  const items: DueItem[] = []
  for (const app of apps) {
    if (app.stage === 'offer' || app.stage === 'rejected') continue
    const check = (kind: DueItem['kind'], date?: string) => {
      if (!date) return
      const inDays = daysBetween(now, parseLocalDate(date))
      if (inDays <= withinDays) items.push({ app, kind, date, inDays })
    }
    check('follow-up', app.followUpAt)
    // A deadline only matters before you've applied.
    if (app.stage === 'wishlist') check('deadline', app.deadline)
  }
  return items.sort((a, b) => a.inDays - b.inDays)
}
