'use client'
import { useState, useEffect, useCallback } from 'react'
import { Phone, Mail, Linkedin, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Prospect, Activity } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function StatCard({ label, value, sub, color = 'slate' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl px-4 py-3 text-center min-w-[110px]">
      <p className="text-xs text-on-surface-variant font-medium">{label}</p>
      <p className={cn('text-2xl font-extrabold leading-tight',
        color === 'green' ? 'text-emerald-600' :
        color === 'amber' ? 'text-amber-500' :
        color === 'red'   ? 'text-red-500' : 'text-on-surface'
      )}>{value}</p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  )
}

export default function HistoryView() {
  const [prospects,     setProspects]     = useState<Prospect[]>([])
  const [activityMap,   setActivityMap]   = useState<Record<string, Activity[]>>({})
  const [loading,       setLoading]       = useState(true)
  const [restoring,     setRestoring]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('prospects').select('*').in('status', ['completed', 'passed']).order('updated_at', { ascending: false }),
      supabase.from('activities').select('*'),
    ])
    const prospects = p ?? []
    const activities = a ?? []
    const map: Record<string, Activity[]> = {}
    for (const act of activities) {
      map[act.prospect_id] = [...(map[act.prospect_id] ?? []), act]
    }
    setProspects(prospects)
    setActivityMap(map)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function restore(id: string) {
    setRestoring(id)
    await supabase.from('prospects').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id)
    setRestoring(null)
    load()
  }

  // Aggregate stats across all history
  const allActs    = Object.values(activityMap).flat()
  const calls      = allActs.filter(a => a.type === 'call')
  const emails     = allActs.filter(a => a.type === 'email')
  const linkedins  = allActs.filter(a => a.type === 'linkedin')
  const pct = (n: number, d: number) => d === 0 ? '—' : `${Math.round((n / d) * 100)}%`

  const completed = prospects.filter(p => p.status === 'completed')
  const passed    = prospects.filter(p => p.status === 'passed')
  const avgScore  = completed.length ? Math.round(completed.reduce((s, p) => s + p.score, 0) / completed.length) : null

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-on-surface-variant gap-2">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading history…
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Pursued"   value={completed.length} sub="completed" color="green" />
        <StatCard label="Passed"    value={passed.length}    sub="not pursued" />
        <StatCard label="Avg Score" value={avgScore ?? '—'}  sub="of pursued" />
        <StatCard label="Calls"     value={calls.length}     sub={`${pct(calls.filter(a => a.outcome === 'Picked up').length, calls.length)} pickup`} />
        <StatCard label="Emails"    value={emails.length}    sub={`${pct(emails.filter(a => a.outcome === 'Replied').length, emails.length)} reply`} />
        <StatCard label="LinkedIn"  value={linkedins.length} sub={`${pct(linkedins.filter(a => a.outcome?.startsWith('Accepted')).length, linkedins.length)} accepted`} />
      </div>

      {prospects.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant">
          <p className="text-base font-semibold mb-1">No history yet</p>
          <p className="text-sm">Companies you mark as done or pass will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-outline-variant bg-surface-low">
                <tr className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="py-3 px-3 text-center w-16">Score</th>
                  <th className="py-3 px-3 text-center w-20">Status</th>
                  <th className="py-3 px-3 text-center w-28">Result</th>
                  <th className="text-left py-3 px-4">Channels</th>
                  <th className="text-left py-3 px-4">Outcomes</th>
                  <th className="py-3 px-4 text-right w-24">Date</th>
                  <th className="py-3 px-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {prospects.map(p => {
                  const acts = activityMap[p.id] ?? []
                  const isDQ = p.score_status === 'DISQUALIFIED'

                  const outcomeIcons = acts.map(a => {
                    const Icon = { call: Phone, email: Mail, linkedin: Linkedin }[a.type]
                    const isPos = a.outcome === 'Picked up' || a.outcome === 'Replied' || a.outcome?.startsWith('Accepted')
                    return Icon ? (
                      <span key={a.id} className={cn('inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded',
                        isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                      )}>
                        <Icon className="w-2.5 h-2.5" /> {a.outcome}
                      </span>
                    ) : null
                  })

                  return (
                    <tr key={p.id} className="border-b border-outline-variant/50 hover:bg-surface-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold">{p.company_name}</p>
                        <p className="text-xs text-on-surface-variant">{p.domain}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={cn('text-base font-extrabold',
                          isDQ ? 'text-red-400' : p.score >= 80 ? 'text-emerald-600' : p.score >= 60 ? 'text-amber-500' : 'text-slate-400'
                        )}>{isDQ ? '—' : p.score}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.status === 'completed'
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Done</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Passed</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.outcome_status === 'pickup_sale'    ? <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Sold</span> :
                         p.outcome_status === 'pickup_no_sale' ? <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">No Sale</span> :
                         p.outcome_status === 'no_pickup'      ? <span className="inline-block text-xs font-semibold text-on-surface-variant bg-surface-low border border-outline-variant px-2 py-0.5 rounded-full">No Pickup</span> :
                         <span className="text-xs text-on-surface-variant/40">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {p.approach.map(ch => {
                            const Icon = { call: Phone, email: Mail, linkedin: Linkedin }[ch as 'call'|'email'|'linkedin']
                            return Icon ? <Icon key={ch} className="w-3.5 h-3.5 text-on-surface-variant" /> : null
                          })}
                          {p.approach.length === 0 && <span className="text-xs text-on-surface-variant">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {outcomeIcons.length ? outcomeIcons : <span className="text-xs text-on-surface-variant">No activity</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-on-surface-variant">{formatDate(p.updated_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => restore(p.id)} disabled={restoring === p.id}
                          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                          {restoring === p.id ? '…' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
