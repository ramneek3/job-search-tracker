import { Skeleton } from './ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="flex gap-3 p-6" role="status" aria-label="Loading">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-subtle flex w-72 shrink-0 flex-col gap-2 rounded-xl p-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 - (i % 3) }, (_, j) => (
            <Skeleton key={j} className="h-20 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}
