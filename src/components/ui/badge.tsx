import type { Stage } from '@/lib/constants'
import { STAGE_STYLES } from './stage-styles'
import { STAGE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        STAGE_STYLES[stage].badge,
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', STAGE_STYLES[stage].dot)} />
      {STAGE_LABELS[stage]}
    </span>
  )
}
