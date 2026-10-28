import { useMemo } from 'react'
import { filterApplications } from '@/lib/filters'
import { useApplications } from './useApplications'
import { useFilters } from './useFilters'

export function useFilteredApplications() {
  const query = useApplications()
  const [filters] = useFilters()
  const filtered = useMemo(
    () => filterApplications(query.data ?? [], filters),
    [query.data, filters],
  )
  return { ...query, all: query.data ?? [], filtered, filters }
}
