import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from '@/components/ui/menu'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useFilters } from '@/hooks/useFilters'
import { useHotkeys } from '@/hooks/useHotkeys'
import { EMPTY_FILTERS, hasActiveFilters } from '@/lib/filters'
import { SOURCES, SOURCE_LABELS, STAGES, STAGE_LABELS } from '@/lib/constants'
import { cn, pluralize } from '@/lib/utils'

function MultiSelect<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  labels: Record<T, string>
  value: T[]
  onChange: (v: T[]) => void
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          size="sm"
          className={cn(value.length && 'border-brand-500/60 text-brand-700 dark:text-brand-100')}
        >
          {label}
          {value.length > 0 && (
            <span className="bg-brand-600 rounded-full px-1.5 text-[10px] text-white tabular-nums">
              {value.length}
            </span>
          )}
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuContent align="start">
        {options.map((o) => (
          <MenuCheckboxItem
            key={o}
            checked={value.includes(o)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(checked ? [...value, o] : value.filter((v) => v !== o))
            }
          >
            {labels[o]}
          </MenuCheckboxItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

export function FilterBar({
  total,
  shown,
  showStage = true,
}: {
  total: number
  shown: number
  showStage?: boolean
}) {
  const [filters, setFilters] = useFilters()
  const [q, setQ] = useState(filters.q)
  const debounced = useDebouncedValue(q, 200)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounced !== filters.q) setFilters({ q: debounced })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])
  // Keep the box in sync when the URL changes from elsewhere (back button, "clear").
  useEffect(() => setQ(filters.q), [filters.q])

  useHotkeys({ '/': () => searchRef.current?.focus() })

  const active = hasActiveFilters(filters)

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
      <div className="relative w-full sm:w-64">
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          ref={searchRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setQ(''), e.currentTarget.blur())}
          placeholder="Search company, role, notes…"
          aria-label="Search applications"
          aria-keyshortcuts="/"
          className="border-base h-8 w-full rounded-lg border bg-[var(--bg)] pr-8 pl-8 text-sm shadow-sm"
        />
        <kbd className="text-muted border-base pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border px-1 text-[10px] sm:block">
          /
        </kbd>
      </div>
      {showStage && (
        <MultiSelect
          label="Stage"
          options={STAGES}
          labels={STAGE_LABELS}
          value={filters.stages}
          onChange={(stages) => setFilters({ stages })}
        />
      )}
      <MultiSelect
        label="Source"
        options={SOURCES}
        labels={SOURCE_LABELS}
        value={filters.sources}
        onChange={(sources) => setFilters({ sources })}
      />
      {active && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setQ('')
            setFilters({ ...EMPTY_FILTERS, sort: filters.sort })
          }}
        >
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      )}
      <p className="text-muted ml-auto text-xs tabular-nums" aria-live="polite">
        {active
          ? `${shown.toLocaleString()} of ${pluralize(total, 'application')}`
          : pluralize(total, 'application')}
      </p>
    </div>
  )
}
