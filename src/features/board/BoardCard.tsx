import { forwardRef, memo, type HTMLAttributes } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BellRing, MapPin } from 'lucide-react'
import { SOURCE_LABELS } from '@/lib/constants'
import type { Application } from '@/lib/schema'
import { cn, daysBetween, formatDate, parseLocalDate } from '@/lib/utils'

function followUpLabel(date?: string): { text: string; overdue: boolean } | null {
  if (!date) return null
  const days = daysBetween(new Date(), parseLocalDate(date))
  if (days > 3) return null
  if (days < 0) return { text: `Follow-up ${-days}d overdue`, overdue: true }
  if (days === 0) return { text: 'Follow up today', overdue: true }
  return { text: `Follow up in ${days}d`, overdue: false }
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  app: Application
  dragging?: boolean
  overlay?: boolean
}

/** Pure presentational card; also used for the drag overlay. */
export const CardView = memo(
  forwardRef<HTMLDivElement, CardProps>(function CardView(
    { app, dragging, overlay, className, ...props },
    ref,
  ) {
    const follow =
      app.stage !== 'offer' && app.stage !== 'rejected' ? followUpLabel(app.followUpAt) : null
    return (
      <div
        ref={ref}
        className={cn(
          'surface group cursor-grab rounded-lg p-3 text-left shadow-xs transition-shadow select-none hover:shadow-md active:cursor-grabbing',
          dragging && 'opacity-40',
          // No rotate/scale here: it changes the overlay's bounding box, which the keyboard
          // sensor uses to find the next column, and breaks arrow-key navigation.
          overlay && 'ring-brand-500 shadow-xl ring-2',
          className,
        )}
        {...props}
      >
        <p className="truncate text-sm font-semibold">{app.company}</p>
        <p className="text-muted mt-0.5 line-clamp-2 text-xs">{app.role}</p>
        <div className="text-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {app.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {app.location}
            </span>
          )}
          <span>{SOURCE_LABELS[app.source]}</span>
          {app.appliedAt && <span>Applied {formatDate(app.appliedAt)}</span>}
        </div>
        {follow && (
          <p
            className={cn(
              'mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
              follow.overdue
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
            )}
          >
            <BellRing className="size-3" aria-hidden />
            {follow.text}
          </p>
        )}
      </div>
    )
  }),
)

export function SortableCard({ app, onOpen }: { app: Application; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
  })
  return (
    <CardView
      ref={setNodeRef}
      app={app}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${app.company}, ${app.role}`}
      data-testid="board-card"
      onClick={() => onOpen(app.id)}
      onKeyDown={(e) => {
        // Space is reserved for picking the card up (see KeyboardSensor config).
        if (e.key === 'Enter' && !isDragging) onOpen(app.id)
        listeners?.onKeyDown?.(e)
      }}
    />
  )
}
