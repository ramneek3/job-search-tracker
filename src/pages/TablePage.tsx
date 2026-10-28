import { FilterBar } from '@/features/applications/FilterBar'
import { ApplicationsTable } from '@/features/table/ApplicationsTable'
import { EmptyState, ErrorState, NoResults } from '@/components/States'
import { Skeleton } from '@/components/ui/skeleton'
import { useDataActions } from '@/hooks/useDataActions'
import { useEditor } from '@/hooks/useEditor'
import { useFilteredApplications } from '@/hooks/useFilteredApplications'
import { useFilters } from '@/hooks/useFilters'
import { EMPTY_FILTERS } from '@/lib/filters'

export default function TablePage() {
  const { all, filtered, isPending, error, refetch } = useFilteredApplications()
  const [filters, setFilters] = useFilters()
  const editor = useEditor()
  const data = useDataActions()

  if (isPending)
    return (
      <div className="flex flex-col gap-2 p-6" role="status" aria-label="Loading">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (all.length === 0)
    return <EmptyState onAdd={() => editor.openNew()} onImport={data.chooseImportFile} />

  return (
    <>
      <h1 className="sr-only">Table</h1>
      <FilterBar total={all.length} shown={filtered.length} />
      {filtered.length === 0 ? (
        <NoResults onClear={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })} />
      ) : (
        <ApplicationsTable apps={filtered} />
      )}
    </>
  )
}
