import type { Stage } from '@/lib/constants'

export const STAGE_STYLES: Record<Stage, { dot: string; badge: string }> = {
  wishlist: {
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  },
  applied: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  oa: {
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  },
  interview: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  offer: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  rejected: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
}
