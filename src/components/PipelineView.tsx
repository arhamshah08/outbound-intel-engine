'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Linkedin, CheckCircle, Plus, Loader2, BookOpen, ChevronDown, ChevronUp, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Prospect, Activity, CallBrief } from '@/lib/types'
import PlaybookPanel from './PlaybookPanel'

const CHANNEL_ICON = { call: Phone, email: Mail, linkedin: Linkedin }
const CHANNEL_LABEL = { call: 'Call', email: 'Email', linkedin: 'LinkedIn' }

const OUTCOMES: Record<string, string[]> = {
  call:     ['Picked up', 'No answer', 'Voicemail', 'Wrong person'],
  email:    ['Replied', 'No response', 'Bounced', 'Out of office'],
  linkedin: ['Accepted + replied', 'Accepted', 'Pending', 'Declined'],
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl px-4 py-3 text-center min-w-[100px]">
      <p className="text-xs text-on-surface-variant font-medium">{label}</p>
      <p className="text-xl font-extrabold text-on-surface leading-tight">{value}</p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  )
}

function LogForm({
  prospectId, contacts, type, onLogged,
}: {
  prospectId: string
  contacts: Prospect['contacts']
  type: 'call' | 'email' | 'linkedin'
  onLogged: () => void
}) {
  const [contactName, setContactName] = useState(contacts[0]?.name ?? '')
  const [outcome, setOutcome]         = useState('')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)

  async function save() {
    if (!outcome) return
    setSaving(true)
    await supabase.from('activities').insert({
      prospect_id:   prospectId,
      type,
      contact_name:  contactName,
      contact_title: contacts.find(c => c.name === contactName)?.title,
      outcome,
      notes,
    })
    setSaving(false)
    onLogged()
  }

  return (
    <div className="mt-2 p-3 bg-surface-low border border-outline-variant rounded-xl space-y-2 text-xs">
      {contacts.length > 1 && (
        <select value={contactName} onChange={e => setContactName(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-outline-variant bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">
          {contacts.map(c => <option key={c.name}>{c.name} — {c.title}</option>)}
        </select>
      )}
      <select value={outcome} onChange={e => setOutcome(e.target.value)}
        className="w-full px-2 py-1.5 rounded-lg border border-outline-variant bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">
        <option value="">Select outcome…</option>
        {OUTCOMES[type].map(o => <option key={o}>{o}</option>)}
      </select>
      <input value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-2 py-1.5 rounded-lg border border-outline-variant bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
      <button onClick={save} disabled={!outcome || saving}
        className="w-full py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Log {CHANNEL_LABEL[type]}
      </button>
    </div>
  )
}

// ─── Outcome Tracker ─────────────────────────────────────────────────────────

type OutcomeStatus = 'no_pickup' | 'pickup_no_sale' | 'pickup_sale'

const OUTCOMES_META: { key: OutcomeStatus; label: string; sub: string; color: string }[] = [
  { key: 'no_pickup',      label: 'No Pickup',  sub: 'No answer / voicemail',  color: 'text-muted-foreground border-border hover:bg-muted' },
  { key: 'pickup_no_sale', label: 'Talked, No Sale', sub: 'Connected but did not close', color: 'text-amber-700 border-amber-200 hover:bg-amber-50' },
  { key: 'pickup_sale',    label: 'Sold',       sub: 'Deal closed',             color: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
]

function OutcomeTracker({ prospect }: { prospect: Prospect }) {
  const [current, setCurrent] = useState<OutcomeStatus | null>(prospect.outcome_status ?? null)
  const [saving, setSaving]   = useState(false)

  async function set(key: OutcomeStatus) {
    const next = current === key ? null : key
    setCurrent(next)
    setSaving(true)
    await supabase.from('prospects').update({ outcome_status: next }).eq('id', prospect.id)
    setSaving(false)
  }

  return (
    <div className="pt-3 border-t border-outline-variant/50 space-y-2">
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
        Outreach Result {saving && <span className="normal-case font-normal opacity-50">saving…</span>}
      </p>
      <div className="flex gap-2 flex-wrap">
        {OUTCOMES_META.map(o => (
          <button key={o.key} onClick={() => set(o.key)}
            className={cn(
              'flex-1 min-w-[100px] py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all',
              current === o.key
                ? o.key === 'pickup_sale'    ? 'bg-emerald-600 text-white border-emerald-600'
                : o.key === 'pickup_no_sale' ? 'bg-amber-500 text-white border-amber-500'
                :                              'bg-foreground text-background border-foreground'
                : o.color
            )}>
            {o.label}
            <span className={cn('block text-xs mt-0.5 font-normal',
              current === o.key ? 'opacity-70' : 'opacity-50'
            )}>{o.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Score Adjuster ───────────────────────────────────────────────────────────

function ScoreAdjuster({ prospect }: { prospect: Prospect }) {
  const [open,    setOpen]    = useState(false)
  const [saving,  setSaving]  = useState(false)

  // Build map of current adjustments
  const corrMap = Object.fromEntries(
    (prospect.score_corrections ?? []).map(c => [c.dimension, c.adjusted])
  )
  const [local, setLocal] = useState<Record<string, number>>(corrMap)

  const dims = prospect.score_dimensions ?? []

  async function adjust(dimension: string, original: number, delta: number, max: number) {
    const current = local[dimension] ?? original
    const next    = Math.max(0, Math.min(max, current + delta))
    const updated = { ...local, [dimension]: next }
    setLocal(updated)
    setSaving(true)
    const corrections = dims.map(d => ({
      dimension:  d.name,
      original:   d.score,
      adjusted:   updated[d.name] ?? d.score,
    }))
    await supabase.from('prospects').update({ score_corrections: corrections }).eq('id', prospect.id)
    setSaving(false)
  }

  if (dims.length === 0) return null

  return (
    <div className="pt-2">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors">
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        Score Feedback
        {saving && <span className="opacity-40 ml-1">saving…</span>}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 animate-slide-in">
          {dims.map(d => {
            const adjusted = local[d.name] ?? d.score
            const delta    = adjusted - d.score
            return (
              <div key={d.name} className="space-y-1.5 pb-2.5 border-b border-border/50 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-32 text-on-surface-variant font-medium truncate">{d.name}</span>
                  <button onClick={() => adjust(d.name, d.score, -1, d.maxScore)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-on-surface-variant hover:bg-muted transition-colors text-sm leading-none">−</button>
                  <span className="w-12 text-center font-semibold tabular-nums text-on-surface">
                    {adjusted}<span className="text-on-surface-variant font-normal">/{d.maxScore}</span>
                  </span>
                  <button onClick={() => adjust(d.name, d.score, +1, d.maxScore)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-on-surface-variant hover:bg-muted transition-colors text-sm leading-none">+</button>
                  {delta !== 0 && (
                    <span className={cn('text-xs font-semibold w-8',
                      delta > 0 ? 'text-emerald-600' : 'text-red-500'
                    )}>{delta > 0 ? `+${delta}` : delta}</span>
                  )}
                </div>
                {d.evidence && (
                  <p className="text-xs text-on-surface-variant/70 pl-1 leading-relaxed">{d.evidence}</p>
                )}
                {d.sourceUrl ? (
                  <a href={d.sourceUrl.startsWith('http') ? d.sourceUrl : `https://${d.sourceUrl}`}
                    target="_blank" rel="noreferrer"
                    className={cn(
                      'inline-flex items-center gap-1 text-xs pl-1 transition-colors',
                      d.evidenceVerified
                        ? 'text-primary/70 hover:text-primary'
                        : 'text-amber-700 hover:text-amber-800'
                    )}>
                    {d.evidenceVerified ? 'Source ↗' : <><span>⚠ Unverified source ↗</span></>}
                  </a>
                ) : d.researchUrl ? (
                  <a href={d.researchUrl.startsWith('http') ? d.researchUrl : `https://${d.researchUrl}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-primary/60 hover:text-primary transition-colors pl-1">
                    Source ↗
                  </a>
                ) : (
                  <span className="text-xs text-amber-700/70 pl-1">⚠ No source cited</span>
                )}
              </div>
            )
          })}
          {(() => {
            const adjustedTotal = dims.reduce((sum, d) => sum + (local[d.name] ?? d.score), 0)
            const delta = adjustedTotal - prospect.score
            if (delta === 0) return (
              <p className="text-xs text-on-surface-variant/40 pt-1">Adjustments saved as training signal.</p>
            )
            return (
              <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                <p className="text-xs text-on-surface-variant/40">Adjustments saved as training signal.</p>
                <p className="text-xs font-semibold tabular-nums">
                  <span className="text-on-surface-variant">Adjusted total:</span>{' '}
                  <span className="text-on-surface">{adjustedTotal}/100</span>{' '}
                  <span className={cn(delta > 0 ? 'text-emerald-600' : 'text-red-500')}>
                    ({delta > 0 ? '+' : ''}{delta})
                  </span>
                </p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

type BriefTab = 'notes' | 'call' | 'email' | 'linkedin'

function BriefTabs({ brief, onRegenerate, loading }: { brief: CallBrief | null | undefined; onRegenerate: () => void; loading: boolean }) {
  const [tab, setTab] = useState<BriefTab>('notes')

  if (!brief && !loading) {
    return (
      <button onClick={onRegenerate}
        className="w-full py-2 text-xs font-semibold rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-low transition-colors">
        Generate Notes &amp; Scripts
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-on-surface-variant">
        <Loader2 className="w-3 h-3 animate-spin" /> Generating notes…
      </div>
    )
  }

  const tabs: { key: BriefTab; label: string }[] = [
    { key: 'notes', label: 'Notes' },
    { key: 'call', label: 'Call Script' },
    { key: 'email', label: 'Email' },
    { key: 'linkedin', label: 'LinkedIn' },
  ]

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-outline-variant">
      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              tab === t.key ? 'bg-on-surface text-white' : 'text-on-surface-variant hover:bg-surface-low border border-outline-variant'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Notes */}
      {tab === 'notes' && brief?.notes && (
        <div className="space-y-3">
          <div className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-low rounded-xl p-4 max-h-72 overflow-y-auto">
            {brief.notes}
          </div>
          {brief.researchLinks && brief.researchLinks.filter(Boolean).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sources</p>
              {brief.researchLinks.filter(Boolean).map((url, i) => (
                <a key={i} href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors truncate">
                  <span className="shrink-0 text-muted-foreground">[{i + 1}]</span>
                  {url}
                </a>
              ))}
            </div>
          )}
          {brief.painPoints && brief.painPoints.filter(p => p.source_url).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pain Point Sources</p>
              {brief.painPoints.filter(p => p.source_url).map((p, i) => (
                <div key={i} className="text-xs border-l-2 border-border pl-2.5 space-y-0.5">
                  <p className="text-on-surface-variant">{p.pain}</p>
                  <a href={p.source_url.startsWith('http') ? p.source_url : `https://${p.source_url}`}
                    target="_blank" rel="noreferrer"
                    className="text-primary/60 hover:text-primary transition-colors">
                    Source ↗
                  </a>
                </div>
              ))}
            </div>
          )}
          {brief.stillMissing && brief.stillMissing.filter(s => s.item).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Research Gaps</p>
              <div className="space-y-1.5 bg-surface-low border border-outline-variant rounded-xl p-3">
                {brief.stillMissing.filter(s => s.item).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-on-surface-variant/60 shrink-0 mt-0.5">□</span>
                    <div className="min-w-0">
                      <p className="text-on-surface">{s.item}</p>
                      {s.where && <p className="text-on-surface-variant/70 mt-0.5">→ {s.where}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call Script */}
      {tab === 'call' && (
        <div className="space-y-3">
          {brief?.openWith && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Open With</p>
              <p className="text-xs leading-relaxed">&ldquo;{brief.openWith}&rdquo;</p>
            </div>
          )}
          {brief?.callBody && (
            <div className="p-3 bg-surface-low border border-outline-variant rounded-xl">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Full Call Script</p>
              <p className="text-xs leading-relaxed whitespace-pre-wrap text-on-surface">{brief.callBody}</p>
            </div>
          )}
          {brief?.referenceOnCall && brief.referenceOnCall.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Reference Points</p>
              {brief.referenceOnCall.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 bg-surface-low rounded-lg">
                  <span className="text-primary font-bold shrink-0 mt-0.5">→</span>
                  <div className="min-w-0 flex-1">
                    <p>{r.point}</p>
                    {r.url && (
                      <a href={r.url.startsWith('http') ? r.url : `https://${r.url}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary/60 hover:text-primary transition-colors mt-0.5">
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email */}
      {tab === 'email' && (
        <div className="space-y-3">
          {brief?.emailSubjectLine && (
            <div className="p-3 bg-surface-low border border-outline-variant rounded-xl">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">Subject</p>
              <p className="text-xs font-semibold">{brief.emailSubjectLine}</p>
            </div>
          )}
          <div className="p-3 border border-outline-variant rounded-xl space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Email Body</p>
            {brief?.personalizedFirstLine && (
              <p className="text-xs font-medium border-b border-outline-variant pb-2">{brief.personalizedFirstLine}</p>
            )}
            {brief?.emailBody && (
              <p className="text-xs leading-relaxed whitespace-pre-wrap text-on-surface">{brief.emailBody}</p>
            )}
          </div>
        </div>
      )}

      {/* LinkedIn */}
      {tab === 'linkedin' && (
        <div className="space-y-3">
          {brief?.linkedinConnectionNote && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Connection Note</p>
              <p className="text-xs">{brief.linkedinConnectionNote}</p>
              <p className="text-xs text-blue-500 mt-1">{brief.linkedinConnectionNote.length}/100 chars</p>
            </div>
          )}
          {brief?.linkedinDM && (
            <div className="p-3 border border-outline-variant rounded-xl">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">Direct Message</p>
              <p className="text-xs">{brief.linkedinDM}</p>
            </div>
          )}
          {brief?.linkedinSequence && (
            <div className="p-3 bg-surface-low border border-outline-variant rounded-xl">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">3-Message Sequence</p>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{brief.linkedinSequence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProspectCard({ prospect, onRefresh }: { prospect: Prospect; onRefresh: () => void }) {
  const [activities,    setActivities]    = useState<Activity[]>([])
  const [logOpen,       setLogOpen]       = useState<'call' | 'email' | 'linkedin' | null>(null)
  const [completing,    setCompleting]    = useState(false)
  const [passing,       setPassing]       = useState(false)
  const [playbookContact, setPlaybookContact] = useState<string | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)

  async function regenerateBrief() {
    setBriefLoading(true)
    const savedProduct = typeof window !== 'undefined' ? localStorage.getItem('vhProduct') : null
    const product = savedProduct?.trim() || 'Healthcare workflow automation platform'
    try {
      await fetch('/api/enrich', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: {
          name: prospect.company_name,
          domain: prospect.domain,
          industry: prospect.industry,
          headcount: prospect.headcount,
          funding: prospect.funding,
          description: prospect.description,
          score: { total: prospect.score, status: prospect.score_status, dimensions: prospect.score_dimensions },
          contacts: prospect.contacts,
          inputData: prospect.pain_points,
        }, product, prospectId: prospect.id }),
      })
      onRefresh()
    } catch {
      // silent
    } finally {
      setBriefLoading(false)
    }
  }

  const loadActivities = useCallback(async () => {
    const { data } = await supabase.from('activities').select('*')
      .eq('prospect_id', prospect.id).order('created_at', { ascending: false })
    setActivities(data ?? [])
  }, [prospect.id])

  useEffect(() => { loadActivities() }, [loadActivities])

  async function markDone() {
    setCompleting(true)
    await supabase.from('prospects').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', prospect.id)
    setCompleting(false)
    onRefresh()
  }

  async function passProspect() {
    setPassing(true)
    await supabase.from('prospects').update({ status: 'passed', updated_at: new Date().toISOString() }).eq('id', prospect.id)
    setPassing(false)
    onRefresh()
  }

  const isDQ    = prospect.score_status === 'DISQUALIFIED'
  const topPain = prospect.pain_points?.[0]?.value?.slice(0, 120)

  return (
    <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-card">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3 bg-surface-low border-b border-outline-variant">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold border',
              isDQ                                   ? 'bg-red-50 text-red-700 border-red-200' :
              prospect.score_status === 'CALL NOW'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              prospect.score_status === 'SEQUENCE'   ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                       'bg-white text-on-surface-variant border-outline-variant'
            )}>
              {isDQ ? 'DQ' : prospect.score_status}
            </span>
            {prospect.approach.map(ch => {
              const Icon = CHANNEL_ICON[ch as keyof typeof CHANNEL_ICON]
              return Icon ? (
                <span key={ch} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-outline-variant rounded-full text-on-surface-variant text-xs">
                  <Icon className="w-3 h-3" /> {CHANNEL_LABEL[ch as keyof typeof CHANNEL_LABEL]}
                </span>
              ) : null
            })}
          </div>
          <h3 className="text-on-surface font-bold text-base leading-tight">{prospect.company_name}</h3>
          <p className="text-on-surface-variant text-xs mt-0.5">{prospect.domain} · {prospect.industry}</p>
          {prospect.location && <span className="text-xs text-on-surface-variant/70">{prospect.location}</span>}
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <div className="text-right">
            <p className={cn('text-2xl font-extrabold leading-none',
              isDQ ? 'text-red-500' : prospect.score >= 80 ? 'text-emerald-600' : prospect.score >= 60 ? 'text-amber-500' : 'text-on-surface-variant'
            )}>{isDQ ? '—' : prospect.score}</p>
            <p className="text-on-surface-variant/60 text-xs mt-0.5">/100</p>
          </div>
          <button onClick={passProspect} disabled={passing}
            title="Remove from pipeline"
            className="w-6 h-6 mt-0.5 flex items-center justify-center rounded-full bg-white border border-outline-variant text-on-surface-variant hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-30">
            {passing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Pain points with sources */}
        {prospect.pain_points && prospect.pain_points.length > 0 && (
          <div className="space-y-1.5">
            {prospect.pain_points.slice(0, 3).map((p, i) => (
              <div key={i} className="flex gap-2 text-xs border-l-2 border-border pl-2.5">
                <span className="text-muted-foreground shrink-0 mt-0.5">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-on-surface-variant leading-relaxed">{p.value}</p>
                  {p.url && (
                    <a href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary/60 hover:text-primary text-xs mt-0.5 transition-colors">
                      Source ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual pre-outreach notes (typed in DecideModal) */}
        {prospect.notes && prospect.notes.trim() && (
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800/80 mb-1">Pre-outreach notes</p>
            <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{prospect.notes}</p>
          </div>
        )}

        {/* Funding tag */}
        {prospect.funding && prospect.funding.length > 3 && (
          <p className="text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface">Funding:</span> {prospect.funding}
          </p>
        )}

        {/* Contacts + Playbook toggle */}
        {prospect.contacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Contacts</p>
            {prospect.contacts.slice(0, 4).map((c, i) => {
              const isOpen = playbookContact === c.name
              return (
                <div key={i} className="border border-outline-variant rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {c.score && (
                          <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded',
                            c.score >= 68 ? 'bg-emerald-100 text-emerald-700' :
                            c.score >= 52 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          )}>{c.score}</span>
                        )}
                        <span className="text-sm font-semibold">{c.name}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{c.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.email && (
                        <a href={`mailto:${c.email}`}
                          title={c.email}
                          className="flex items-center gap-1 text-xs text-on-surface-variant bg-surface-low border border-outline-variant px-2 py-0.5 rounded-lg hover:bg-muted transition-colors">
                          <Mail className="w-3 h-3" /> Email
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`}
                          title={c.phone}
                          className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg hover:bg-emerald-100 transition-colors">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                      {c.linkedin && (
                        <a href={c.linkedin} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition-colors">
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </a>
                      )}
                      <button onClick={() => setPlaybookContact(isOpen ? null : c.name)}
                        className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border transition-all',
                          isOpen ? 'bg-primary text-white border-primary' : 'text-primary border-primary/30 hover:bg-primary/5'
                        )}>
                        <BookOpen className="w-3 h-3" />
                        {isOpen ? 'Close' : 'Playbook'}
                        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-outline-variant px-3 py-3 bg-surface-low/30">
                      <PlaybookPanel prospect={prospect} contact={c} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Brief Tabs */}
        <BriefTabs brief={prospect.call_brief} onRegenerate={regenerateBrief} loading={briefLoading} />

        {/* Activities */}
        {activities.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Activity ({activities.length})</p>
            {activities.slice(0, 5).map(a => {
              const Icon = CHANNEL_ICON[a.type]
              const isPositive = a.outcome === 'Picked up' || a.outcome === 'Replied' || a.outcome?.startsWith('Accepted')
              return (
                <div key={a.id} className="flex items-start gap-2 text-xs">
                  <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', isPositive ? 'text-emerald-500' : 'text-on-surface-variant')} />
                  <div className="flex-1 min-w-0">
                    <span className={cn('font-semibold', isPositive ? 'text-emerald-700' : 'text-on-surface')}>{a.outcome}</span>
                    {a.contact_name && <span className="text-on-surface-variant ml-1">· {a.contact_name}</span>}
                    {a.notes && <span className="text-on-surface-variant ml-1">· {a.notes}</span>}
                  </div>
                  <span className="text-on-surface-variant shrink-0">{formatDate(a.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Outcome Tracker */}
        <OutcomeTracker prospect={prospect} />

        {/* Score Adjuster */}
        <ScoreAdjuster prospect={prospect} />

        {/* Log buttons */}
        <div className="pt-1 border-t border-outline-variant/50">
          <div className="flex gap-1.5 flex-wrap">
            {prospect.approach.map(ch => {
              const Icon = CHANNEL_ICON[ch as keyof typeof CHANNEL_ICON]
              const isOpen = logOpen === ch
              return Icon ? (
                <button key={ch} onClick={() => setLogOpen(isOpen ? null : ch as 'call' | 'email' | 'linkedin')}
                  className={cn('flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                    isOpen ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'
                  )}>
                  <Icon className="w-3 h-3" />
                  <Plus className="w-2.5 h-2.5" />
                  {CHANNEL_LABEL[ch as keyof typeof CHANNEL_LABEL]}
                </button>
              ) : null
            })}
            <button onClick={markDone} disabled={completing}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50">
              <CheckCircle className="w-3 h-3" />
              {completing ? 'Saving…' : 'Done'}
            </button>
          </div>

          {logOpen && (
            <LogForm
              prospectId={prospect.id}
              contacts={prospect.contacts}
              type={logOpen}
              onLogged={() => { loadActivities(); setLogOpen(null) }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type SortBy = 'score' | 'date' | 'name'

export default function PipelineView() {
  const router = useRouter()
  const [prospects,     setProspects]     = useState<Prospect[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [loading,       setLoading]       = useState(true)

  // Filters
  const [statusFilter,   setStatusFilter]   = useState('ALL')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [fundingFilter,  setFundingFilter]  = useState('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [sortBy,         setSortBy]         = useState<SortBy>('score')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('prospects').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('activities').select('*'),
    ])
    setProspects(p ?? [])
    setAllActivities(a ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const calls    = allActivities.filter(a => a.type === 'call')
  const emails   = allActivities.filter(a => a.type === 'email')
  const linkedin = allActivities.filter(a => a.type === 'linkedin')
  const pct = (n: number, d: number) => d === 0 ? '—' : `${Math.round((n / d) * 100)}%`

  // Unique values for filter dropdowns
  const industries = Array.from(new Set(prospects.map(p => p.industry).filter(Boolean)))
  const campaigns  = Array.from(new Set(prospects.map(p => p.campaign_name).filter(Boolean)))

  const hasFunding = (f: string) => f && f.length > 4 && !f.toLowerCase().includes('no funding') && !f.toLowerCase().includes('none') && !f.toLowerCase().includes('unknown')

  const filtered = prospects
    .filter(p => statusFilter === 'ALL' || p.score_status === statusFilter)
    .filter(p => industryFilter === 'all' || p.industry === industryFilter)
    .filter(p => campaignFilter === 'all' || p.campaign_name === campaignFilter)
    .filter(p => fundingFilter === 'all' || (fundingFilter === 'funded' ? hasFunding(p.funding) : !hasFunding(p.funding)))
    .filter(p => !locationFilter.trim() || (p.location ?? '').toLowerCase().includes(locationFilter.toLowerCase()))
    .sort((a, b) =>
      sortBy === 'score' ? b.score - a.score :
      sortBy === 'date'  ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() :
      a.company_name.localeCompare(b.company_name)
    )

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-on-surface-variant gap-2">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading pipeline…
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Active" value={prospects.length} sub="companies" />
        <StatPill label="Calls" value={calls.length} sub={`${pct(calls.filter(a => a.outcome === 'Picked up').length, calls.length)} pickup`} />
        <StatPill label="Emails" value={emails.length} sub={`${pct(emails.filter(a => a.outcome === 'Replied').length, emails.length)} reply`} />
        <StatPill label="LinkedIn" value={linkedin.length} sub={`${pct(linkedin.filter(a => a.outcome?.startsWith('Accepted')).length, linkedin.length)} accepted`} />
      </div>

      {/* Filter bar */}
      {prospects.length > 0 && (
        <div className="bg-white border border-outline-variant rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Score status chips */}
          <div className="flex gap-1.5 flex-wrap">
            {['ALL', 'CALL NOW', 'SEQUENCE', 'DEPRIORITIZE'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                  statusFilter === s
                    ? s === 'CALL NOW' ? 'bg-emerald-500 text-white' :
                      s === 'SEQUENCE' ? 'bg-amber-400 text-white' :
                      s === 'DEPRIORITIZE' ? 'bg-slate-400 text-white' :
                      'bg-primary text-white'
                    : 'bg-surface-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                )}>
                {s === 'ALL' ? 'All' : s}
                {s !== 'ALL' && (
                  <span className="ml-1 opacity-60">
                    ({prospects.filter(p => p.score_status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-outline-variant hidden sm:block" />

          {/* Industry dropdown */}
          {industries.length > 1 && (
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-white text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary/40">
              <option value="all">All Industries</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}

          {/* Funding filter */}
          <select value={fundingFilter} onChange={e => setFundingFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-white text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary/40">
            <option value="all">All Funding</option>
            <option value="funded">Has Funding</option>
            <option value="none">No Funding</option>
          </select>

          {/* Campaign filter */}
          {campaigns.length > 1 && (
            <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-white text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary/40">
              <option value="all">All Campaigns</option>
              {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* Location filter */}
          <input
            type="text"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            placeholder="Location…"
            className="px-3 py-2 text-xs rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-36"
          />

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
            className="ml-auto px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-white text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary/40">
            <option value="score">Score ↓</option>
            <option value="date">Newest First</option>
            <option value="name">Name A–Z</option>
          </select>

          {filtered.length !== prospects.length && (
            <span className="text-xs text-on-surface-variant whitespace-nowrap">
              {filtered.length} of {prospects.length} shown
            </span>
          )}
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant">
          <p className="text-base font-semibold mb-1 text-on-surface">No active prospects</p>
          <p className="text-sm">Run an analysis and click <strong>+ Pipeline</strong> on any result to start tracking.</p>
          <button onClick={() => router.push('/')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-glow-primary">
            <Search className="w-4 h-4" />
            Go to Research →
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-2xl p-8 text-center text-on-surface-variant">
          <p className="text-sm font-semibold">No prospects match the current filters</p>
          <button onClick={() => { setStatusFilter('ALL'); setIndustryFilter('all'); setCampaignFilter('all'); setFundingFilter('all') }}
            className="mt-2 text-xs text-primary hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(p => <ProspectCard key={p.id} prospect={p} onRefresh={load} />)}
        </div>
      )}
    </div>
  )
}
