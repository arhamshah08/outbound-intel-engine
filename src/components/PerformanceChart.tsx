'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

type ScoreItem = { score: number; status?: string }
type OutcomeItem = { outcome_status?: string | null; status?: string }

const STATUS_COLORS: Record<string, string> = {
  'CALL NOW':      '#10b981', // emerald
  'SEQUENCE':      '#f59e0b', // amber
  'DEPRIORITIZE':  '#94a3b8', // slate
  'INSUFFICIENT':  '#fbbf24', // amber-300
  'DISQUALIFIED':  '#ef4444', // red
}

const OUTCOME_COLORS: Record<string, string> = {
  'Sold':       '#10b981',
  'No Sale':    '#f59e0b',
  'No Pickup':  '#94a3b8',
  'Pending':    '#cbd5e1',
}

export function ScoreDistributionChart({
  items, title, height = 180,
}: {
  items: ScoreItem[]
  title?: string
  height?: number
}) {
  // Bucket scores into 5 bands. DQ/INSUFFICIENT show separately so user can
  // see how many companies the engine refused to score vs. low-scored ones.
  const buckets = [
    { band: '0–19',  count: 0 },
    { band: '20–39', count: 0 },
    { band: '40–59', count: 0 },
    { band: '60–79', count: 0 },
    { band: '80–100', count: 0 },
  ]
  let dq = 0
  let insufficient = 0
  for (const it of items) {
    if (it.status === 'DISQUALIFIED') { dq++; continue }
    if (it.status === 'INSUFFICIENT') { insufficient++; continue }
    const s = it.score
    if (s >= 80) buckets[4].count++
    else if (s >= 60) buckets[3].count++
    else if (s >= 40) buckets[2].count++
    else if (s >= 20) buckets[1].count++
    else buckets[0].count++
  }
  const data = [...buckets, { band: 'DQ', count: dq }, { band: 'Need data', count: insufficient }]
  const bandColor: Record<string, string> = {
    '0–19':     '#cbd5e1',
    '20–39':    '#94a3b8',
    '40–59':    '#cbd5e1',
    '60–79':    '#f59e0b',
    '80–100':   '#10b981',
    'DQ':       '#ef4444',
    'Need data':'#fbbf24',
  }

  return (
    <div className="bg-white rounded-2xl border border-outline-variant p-4">
      {title && <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="band" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.band} fill={bandColor[d.band] ?? '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OutcomeDonutChart({
  items, title, height = 180,
}: {
  items: OutcomeItem[]
  title?: string
  height?: number
}) {
  const counts: Record<string, number> = { Sold: 0, 'No Sale': 0, 'No Pickup': 0, Pending: 0 }
  for (const it of items) {
    if (it.outcome_status === 'pickup_sale') counts.Sold++
    else if (it.outcome_status === 'pickup_no_sale') counts['No Sale']++
    else if (it.outcome_status === 'no_pickup') counts['No Pickup']++
    else counts.Pending++
  }
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-white rounded-2xl border border-outline-variant p-4">
      {title && <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-3">{title}</p>}
      {total === 0 ? (
        <div className="flex items-center justify-center text-xs text-on-surface-variant/60" style={{ height }}>
          No outreach activity yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
              {data.map(d => (
                <Cell key={d.name} fill={OUTCOME_COLORS[d.name] ?? '#cbd5e1'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// Re-export the constants in case the host page wants matching swatches
export { STATUS_COLORS, OUTCOME_COLORS }
