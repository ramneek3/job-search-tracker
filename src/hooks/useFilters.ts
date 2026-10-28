import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { parseFilters, serializeFilters, type Filters } from '@/lib/filters'

/** Filters are URL state: shareable, bookmarkable and preserved across views and reloads. */
export function useFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const setFilters = useCallback(
    (update: Partial<Filters> | ((f: Filters) => Partial<Filters>)) =>
      setParams(
        (prev) => {
          const current = parseFilters(prev)
          const patch = typeof update === 'function' ? update(current) : update
          return serializeFilters({ ...current, ...patch }, prev)
        },
        // Typing in search shouldn't create a history entry per keystroke.
        { replace: true },
      ),
    [setParams],
  )

  return [filters, setFilters] as const
}
