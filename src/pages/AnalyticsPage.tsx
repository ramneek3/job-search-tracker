import { useMemo, type ReactNode } from 'react'
import { BellRing, CalendarClock } from 'lucide-react'
import { StageBadge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/States'
import { FunnelChart, WeeklyChart } from '@/features/analytics/Charts'
import { useApplications } from '@/hooks/useApplications'
import { useDataActions } from '@/hooks/useDataActions'
import { useEditor } from '@/hooks/useEditor'
import { bySource, computeFunnel, dueSoon, summarize, weeklyActivity } from '@/lib/metrics'
import { cn, formatDate } from '@/lib/utils'

const pct = (n: number) => `${Math.round(n * 100)}%`

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface rounded-xl p-4">
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-muted mt-0.5 text-xs">{hint}</dd>}
    </div>
  )
}

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('surface rounded-xl p-4', className)} aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="text-muted mt-0.5 text-xs">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

export default function AnalyticsPage() {
  const { data: apps, isPending, error, refetch } = useApplications()
  const editor = useEditor()
  const data = useDataActions()

  const m = useMemo(() => {
    const list = apps ?? []
    const now = new Date()
    return {
      summary: summarize(list),
      funnel: computeFunnel(list),
      weekly: weeklyActivity(list, now),
      sources: bySource(list),
      due: dueSoon(list, now),
    }
  }, [apps])

  if (isPending)
    return (
      <div
        className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4"
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className={cn('h-24', i >= 4 && 'h-60 sm:col-span-2')} />
        ))}
      </div>
    )
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!apps.length)
    return <EmptyState onAdd={() => editor.openNew()} onImport={data.chooseImportFile} />

  const { summary, funnel, weekly, sources, due } = m
  const best = sources[0]

  return (
    <div className="overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat
            label="Applications sent"
            value={summary.applied}
            hint={`${summary.total - summary.applied} in wishlist`}
          />
          <Stat
            label="Response rate"
            value={pct(summary.responseRate)}
            hint={`${summary.responded} responses`}
          />
          <Stat
            label="Interviews"
            value={summary.interviews}
            hint={
              summary.applied ? `${pct(summary.interviews / summary.applied)} of sent` : undefined
            }
          />
          <Stat label="Offers" value={summary.offers} />
          <Stat
            label="Median time to reply"
            value={summary.medianDaysToResponse === null ? '—' : `${summary.medianDaysToResponse}d`}
            hint="From applying to first response"
          />
        </dl>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Pipeline funnel" description="How many applications reached each stage">
            <figure>
              <FunnelChart data={funnel} />
              <figcaption className="sr-only">
                {funnel.map((f) => `${f.label}: ${f.count} (${pct(f.ofApplied)})`).join('. ')}
              </figcaption>
            </figure>
          </Panel>
          <Panel title="Weekly activity" description="Applications sent per week, last 12 weeks">
            <figure>
              <WeeklyChart data={weekly} />
              <figcaption className="sr-only">
                {weekly.map((w) => `Week of ${formatDate(w.weekStart)}: ${w.count}`).join('. ')}
              </figcaption>
            </figure>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="What's working"
            description={
              best
                ? `${best.label} gets you the most replies (${pct(best.responseRate)}).`
                : undefined
            }
            className="lg:col-span-3"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-left text-xs">
                  <th scope="col" className="pb-2 font-medium">
                    Source
                  </th>
                  <th scope="col" className="pb-2 text-right font-medium">
                    Sent
                  </th>
                  <th scope="col" className="pb-2 text-right font-medium">
                    Replies
                  </th>
                  <th scope="col" className="w-2/5 pb-2 pl-4 font-medium">
                    Response rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source} className="border-base border-t">
                    <th scope="row" className="py-2 text-left font-medium">
                      {s.label}
                    </th>
                    <td className="py-2 text-right tabular-nums">{s.applied}</td>
                    <td className="py-2 text-right tabular-nums">{s.responded}</td>
                    <td className="py-2 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: pct(s.responseRate) }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs tabular-nums">
                          {pct(s.responseRate)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel
            title="Due soon"
            description="Follow-ups and deadlines in the next 7 days"
            className="lg:col-span-2"
          >
            {due.length === 0 ? (
              <p className="text-muted py-6 text-center text-sm">Nothing due. Nice.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {due.slice(0, 8).map((d) => (
                  <li key={`${d.app.id}-${d.kind}`}>
                    <button
                      type="button"
                      onClick={() => editor.open(d.app.id)}
                      className="hover:bg-subtle flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left"
                    >
                      {d.kind === 'follow-up' ? (
                        <BellRing className="text-muted size-4 shrink-0" aria-hidden />
                      ) : (
                        <CalendarClock className="text-muted size-4 shrink-0" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{d.app.company}</span>
                        <span
                          className={cn(
                            'block text-xs',
                            d.inDays < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted',
                          )}
                        >
                          {d.kind === 'follow-up' ? 'Follow up' : 'Deadline'}{' '}
                          {d.inDays < 0
                            ? `${-d.inDays}d overdue`
                            : d.inDays === 0
                              ? 'today'
                              : `in ${d.inDays}d`}{' '}
                          · {formatDate(d.date)}
                        </span>
                      </span>
                      <StageBadge stage={d.app.stage} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
