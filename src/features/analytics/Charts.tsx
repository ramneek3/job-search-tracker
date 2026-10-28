import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FunnelStep, WeekBucket } from '@/lib/metrics'
import { formatDate } from '@/lib/utils'

const BRAND = '#6366f1'
const FUNNEL_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981']
const axis = { fill: 'var(--fg-muted)', fontSize: 12 }

const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--fg)',
  },
  cursor: { fill: 'var(--bg-muted)' },
}

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={axis}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(v, _n, p) => [
            `${v} (${Math.round((p.payload as FunnelStep).ofApplied * 100)}%)`,
            'Reached',
          ]}
        />
        <Bar
          dataKey="count"
          radius={[0, 6, 6, 0]}
          label={{ position: 'right', fill: 'var(--fg-muted)', fontSize: 12 }}
          isAnimationActive={false}
        >
          {data.map((d, i) => (
            <Cell key={d.stage} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WeeklyChart({ data }: { data: WeekBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="weekStart"
          tickFormatter={(d: string) => formatDate(d)}
          tick={axis}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(d) => `Week of ${formatDate(String(d))}`}
          formatter={(v) => [v, 'Applications']}
        />
        <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
