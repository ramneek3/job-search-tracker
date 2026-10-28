import { SOURCES, STAGES } from './constants'
import type { Application, Source, Stage } from './schema'

export const SORTABLE = [
  'company',
  'role',
  'stage',
  'source',
  'appliedAt',
  'followUpAt',
  'updatedAt',
] as const
export type SortField = (typeof SORTABLE)[number]

export interface Filters {
  q: string
  stages: Stage[]
  sources: Source[]
  sort: { field: SortField; desc: boolean } | null
}

export const EMPTY_FILTERS: Filters = { q: '', stages: [], sources: [], sort: null }

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  return raw.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v))
}

/** URL → filters. Unknown values are dropped so a hand-edited URL can't break the page. */
export function parseFilters(params: URLSearchParams): Filters {
  const [field, dir] = (params.get('sort') ?? '').split('.')
  const sort =
    field && (SORTABLE as readonly string[]).includes(field)
      ? { field: field as SortField, desc: dir === 'desc' }
      : null
  return {
    q: params.get('q') ?? '',
    stages: parseList(params.get('stage'), STAGES),
    sources: parseList(params.get('source'), SOURCES),
    sort,
  }
}

/** Filters → URL, leaving out anything at its default so links stay short. */
export function serializeFilters(f: Filters, base = new URLSearchParams()): URLSearchParams {
  const p = new URLSearchParams(base)
  const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k))
  set('q', f.q.trim())
  set('stage', f.stages.join(','))
  set('source', f.sources.join(','))
  set('sort', f.sort ? `${f.sort.field}.${f.sort.desc ? 'desc' : 'asc'}` : '')
  return p
}

export function hasActiveFilters(f: Filters): boolean {
  return f.q.trim() !== '' || f.stages.length > 0 || f.sources.length > 0
}

export function matchesQuery(app: Application, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return [app.company, app.role, app.location, app.notes, app.contactName]
    .filter(Boolean)
    .some((v) => v!.toLowerCase().includes(needle))
}

export function filterApplications(apps: Application[], f: Filters): Application[] {
  return apps.filter(
    (a) =>
      (f.stages.length === 0 || f.stages.includes(a.stage)) &&
      (f.sources.length === 0 || f.sources.includes(a.source)) &&
      matchesQuery(a, f.q),
  )
}
