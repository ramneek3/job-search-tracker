import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const dateFmtYear = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** "Mar 4" this year, "Mar 4, 2025" otherwise. Dates are YYYY-MM-DD in local time. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = parseLocalDate(iso)
  return (d.getFullYear() === new Date().getFullYear() ? dateFmt : dateFmtYear).format(d)
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / 86_400_000)
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n.toLocaleString()} ${n === 1 ? word : plural}`
}
