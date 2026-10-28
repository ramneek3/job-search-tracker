import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, SearchX } from 'lucide-react'
import { Button } from './ui/button'

function State({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="bg-muted text-muted rounded-full p-3">{icon}</div>
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <State
      icon={<AlertTriangle className="size-5" aria-hidden />}
      title="Couldn't load your applications"
    >
      <p className="text-muted text-sm">{error.message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </State>
  )
}

export function EmptyState({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  return (
    <State icon={<Inbox className="size-5" aria-hidden />} title="No applications yet">
      <p className="text-muted text-sm">
        Add the first role you've applied to — or one you want to — and track it all the way to an
        offer.
      </p>
      <div className="flex gap-2">
        <Button variant="primary" onClick={onAdd}>
          Add application
        </Button>
        <Button onClick={onImport}>Import CSV</Button>
      </div>
    </State>
  )
}

export function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <State icon={<SearchX className="size-5" aria-hidden />} title="Nothing matches these filters">
      <Button onClick={onClear}>Clear filters</Button>
    </State>
  )
}
