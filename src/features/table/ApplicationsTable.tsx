import { useMemo, useRef } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { StageBadge } from '@/components/ui/badge'
import { useEditor } from '@/hooks/useEditor'
import { useFilters } from '@/hooks/useFilters'
import type { SortField } from '@/lib/filters'
import { SOURCE_LABELS, STAGE_ORDER } from '@/lib/constants'
import type { Application } from '@/lib/schema'
import { cn, formatDate } from '@/lib/utils'

const ROW_HEIGHT = 44

const byDate = (a?: string, b?: string) => (a || '').localeCompare(b || '')

const COLUMNS: ColumnDef<Application>[] = [
  {
    id: 'company',
    accessorKey: 'company',
    header: 'Company',
    cell: (c) => <span className="font-medium">{c.getValue<string>()}</span>,
    size: 180,
  },
  { id: 'role', accessorKey: 'role', header: 'Role', size: 260 },
  {
    id: 'stage',
    accessorKey: 'stage',
    header: 'Stage',
    cell: (c) => <StageBadge stage={c.row.original.stage} />,
    sortingFn: (a, b) => STAGE_ORDER[a.original.stage] - STAGE_ORDER[b.original.stage],
    size: 160,
  },
  {
    id: 'source',
    accessorKey: 'source',
    header: 'Source',
    cell: (c) => SOURCE_LABELS[c.row.original.source],
    size: 130,
  },
  {
    id: 'appliedAt',
    accessorKey: 'appliedAt',
    header: 'Applied',
    cell: (c) => formatDate(c.getValue<string>()),
    sortingFn: (a, b) => byDate(a.original.appliedAt, b.original.appliedAt),
    size: 110,
  },
  {
    id: 'followUpAt',
    accessorKey: 'followUpAt',
    header: 'Follow up',
    cell: (c) => formatDate(c.getValue<string>()),
    sortingFn: (a, b) => byDate(a.original.followUpAt, b.original.followUpAt),
    size: 110,
  },
  { id: 'location', accessorKey: 'location', header: 'Location', enableSorting: false, size: 160 },
]

export function ApplicationsTable({ apps }: { apps: Application[] }) {
  const [filters, setFilters] = useFilters()
  const editor = useEditor()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sorting is URL state, so a sorted view survives reloads and can be shared.
  const sorting = useMemo<SortingState>(
    () =>
      filters.sort
        ? [{ id: filters.sort.field, desc: filters.sort.desc }]
        : [{ id: 'appliedAt', desc: true }],
    [filters.sort],
  )

  const table = useReactTable({
    data: apps,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      setFilters({ sort: first ? { field: first.id as SortField, desc: first.desc } : null })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (a) => a.id,
    sortDescFirst: false,
  })

  const rows = table.getRowModel().rows
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })
  const items = virtualizer.getVirtualItems()
  const padTop = items[0]?.start ?? 0
  const padBottom = virtualizer.getTotalSize() - (items.at(-1)?.end ?? 0)

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6"
      data-testid="table-scroll"
    >
      <table
        className="w-full min-w-[900px] table-fixed border-separate border-spacing-0 text-sm"
        aria-rowcount={rows.length + 1}
      >
        <caption className="sr-only">
          Applications, sorted by {sorting[0]?.id} {sorting[0]?.desc ? 'descending' : 'ascending'}.
          Select a row to edit it.
        </caption>
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} aria-rowindex={1}>
              {hg.headers.map((h) => {
                const dir = h.column.getIsSorted()
                return (
                  <th
                    key={h.id}
                    scope="col"
                    style={{ width: h.getSize() }}
                    aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
                    className="border-base bg-subtle text-muted border-y px-3 py-2 text-left text-xs font-medium first:rounded-tl-lg first:border-l last:rounded-tr-lg last:border-r"
                  >
                    {h.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-[var(--fg)]"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {dir === 'asc' ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : dir === 'desc' ? (
                          <ArrowDown className="size-3" aria-hidden />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {padTop > 0 && (
            <tr aria-hidden>
              <td style={{ height: padTop }} colSpan={COLUMNS.length} />
            </tr>
          )}
          {items.map((vi) => {
            const row = rows[vi.index]!
            return (
              <tr
                key={row.id}
                aria-rowindex={vi.index + 2}
                style={{ height: ROW_HEIGHT }}
                className="hover:bg-subtle cursor-pointer"
                onClick={() => editor.open(row.id)}
              >
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'border-base truncate border-b px-3',
                      i === 0 && 'border-l',
                      i === COLUMNS.length - 1 && 'border-r',
                    )}
                  >
                    {i === 0 ? (
                      // A real button per row keeps the table keyboard-accessible.
                      <button
                        type="button"
                        className="max-w-full cursor-pointer truncate text-left"
                        onClick={(e) => {
                          e.stopPropagation()
                          editor.open(row.id)
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </button>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
          {padBottom > 0 && (
            <tr aria-hidden>
              <td style={{ height: padBottom }} colSpan={COLUMNS.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
