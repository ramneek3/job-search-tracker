import { Board } from '@/features/board/Board'
import { FilterBar } from '@/features/applications/FilterBar'
import { PageSkeleton } from '@/components/PageSkeleton'
import { EmptyState, ErrorState, NoResults } from '@/components/States'
import { useDataActions } from '@/hooks/useDataActions'
import { useEditor } from '@/hooks/useEditor'
import { useFilteredApplications } from '@/hooks/useFilteredApplications'
import { useFilters } from '@/hooks/useFilters'
import { EMPTY_FILTERS } from '@/lib/filters'

export default function BoardPage() {
  const { all, filtered, isPending, error, refetch } = useFilteredApplications()
  const [, setFilters] = useFilters()
  const editor = useEditor()
  const data = useDataActions()

  if (isPending) return <PageSkeleton />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (all.length === 0)
    return <EmptyState onAdd={() => editor.openNew()} onImport={data.chooseImportFile} />

  return (
    <>
      <h1 className="sr-only">Board</h1>
      <FilterBar total={all.length} shown={filtered.length} showStage={false} />
      {filtered.length === 0 ? (
        <NoResults onClear={() => setFilters(EMPTY_FILTERS)} />
      ) : (
        <div className="min-h-0 flex-1">
          <Board apps={filtered} />
        </div>
      )}
    </>
  )
}
