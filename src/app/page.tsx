'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Zap, ChevronDown, ChevronUp, ExternalLink, AlertCircle,
  Phone, Mail, Loader2, Plus, X, ClipboardPaste,
  Search, Database, Users, Target, CheckCircle,
  ChevronRight, Clock, Copy, Linkedin, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompanyResult, CallBrief } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ROWS = [
  { name: 'Elevate ENT Partners', website: 'elevateent.com' },
  { name: 'The US Oncology Network', website: 'usoncology.com' },
  { name: 'Growth Orthopedics', website: 'growthorthopedics.com' },
  { name: 'Baylor Scott & White Health', website: 'bswhealth.com' },
  { name: 'Sutter Health', website: 'sutterhealth.org' },
]

const STAGES = [
  { key: 'discover',  label: 'Discover',   Icon: Search,   desc: 'Exa · Company + pain data' },
  { key: 'enrich',   label: 'Enrich',     Icon: Database, desc: 'Signals · Investors · Tech' },
  { key: 'contacts', label: 'Contacts',   Icon: Users,    desc: 'Apollo · LinkedIn · Email' },
  { key: 'deep-dive',label: 'Deep Dive',  Icon: Target,   desc: 'Gap-fill · Targeted search' },
  { key: 'scoring',  label: 'Score',      Icon: Zap,      desc: 'Gemini · 6 dimensions' },
]
const STAGE_ORDER = ['discover', 'enrich', 'contacts', 'deep-dive', 'scoring', 'done']

type CompanyRow    = { name: string; website: string }
type Filter        = 'ALL' | 'HIGH' | 'MED' | 'LOW' | 'DQ'
type OutreachTab   = 'call' | 'email' | 'linkedin'
type ProgressInfo  = { step: string; message: string; iteration: number }

// ─── Small helpers ────────────────────────────────────────────────────────────

function priority(status: CompanyResult['score']['status']): Filter {
  if (status === 'CALL NOW')     return 'HIGH'
  if (status === 'SEQUENCE')     return 'MED'
  if (status === 'DISQUALIFIED') return 'DQ'
  return 'LOW'
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-low transition-colors"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

function PriorityBadge({ status }: { status: CompanyResult['score']['status'] }) {
  const p = priority(status)
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
      p === 'HIGH' ? 'bg-emerald-500 text-white' :
      p === 'MED'  ? 'bg-amber-400 text-white' :
      p === 'DQ'   ? 'bg-red-100 text-red-600' :
                     'bg-slate-100 text-slate-500'
    )}>{p}</span>
  )
}

function ScoreCell({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0
  return (
    <div className={cn('text-center text-xs font-bold py-0.5 px-1.5 rounded-md',
      score === 0  ? 'bg-red-50 text-red-400' :
      pct >= 0.8   ? 'bg-emerald-50 text-emerald-700' :
      pct >= 0.5   ? 'bg-amber-50 text-amber-700' :
                     'bg-slate-50 text-slate-400'
    )}>{score}</div>
  )
}

// ─── Live Pipeline ────────────────────────────────────────────────────────────

function LivePipeline({
  progress, allCompanies, results,
}: {
  progress: Record<string, ProgressInfo>
  allCompanies: string[]
  results: CompanyResult[]
}) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const doneSet     = new Set(results.map(r => r.name))
  const inProgress  = Object.entries(progress)
  const queued      = allCompanies.filter(c => !doneSet.has(c) && !progress[c])

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2D2B69 50%, #1E293B 100%)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <span className="text-white font-bold text-base">Intelligence Engine</span>
          <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-300 text-xs font-bold rounded-full tracking-wide">LIVE</span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5 text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsed}s</span>
          </div>
          <div className="text-white/30 text-xs hidden sm:block">
            {inProgress.length} running · {queued.length} queued · {results.length} done
          </div>
        </div>
      </div>

      {/* Company pipelines */}
      <div className="p-6 space-y-8">
        {inProgress.map(([company, state]) => {
          const activeIdx = STAGE_ORDER.indexOf(state.step)
          return (
            <div key={company} className="animate-slide-in space-y-3">
              {/* Company row header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-white font-semibold text-sm">{company}</span>
                </div>
                {state.iteration > 1 && (
                  <span className="text-xs font-bold text-indigo-300 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/25">
                    ↩ Loop {state.iteration}
                  </span>
                )}
              </div>

              {/* Stage cards */}
              <div className="flex items-stretch gap-1">
                {STAGES.flatMap((stage, i) => {
                  const stageIdx = STAGE_ORDER.indexOf(stage.key)
                  const isDone   = stageIdx < activeIdx || state.step === 'done'
                  const isActive = stageIdx === activeIdx
                  const { Icon } = stage

                  const card = (
                    <div key={stage.key} className={cn(
                      'flex-1 rounded-xl p-3 border transition-all duration-700',
                      isDone   ? 'border-emerald-500/30 bg-emerald-500/8' :
                      isActive ? 'border-indigo-400/50 bg-indigo-500/12 shadow-glow-primary' :
                                 'border-white/8 bg-white/3'
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <Icon className={cn('w-4 h-4 transition-colors duration-500',
                          isDone   ? 'text-emerald-400' :
                          isActive ? 'text-indigo-300' :
                                     'text-white/20'
                        )} />
                        {isDone   && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                        {isActive && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
                      </div>
                      <p className={cn('text-xs font-semibold leading-none mb-0.5 transition-colors duration-500',
                        isDone   ? 'text-emerald-400' :
                        isActive ? 'text-white' :
                                   'text-white/25'
                      )}>{stage.label}</p>
                      <p className={cn('text-xs leading-relaxed transition-colors duration-500',
                        isDone   ? 'text-emerald-400/50' :
                        isActive ? 'text-white/50' :
                                   'text-white/15'
                      )}>{stage.desc}</p>
                    </div>
                  )

                  if (i < STAGES.length - 1) {
                    const arrow = (
                      <div key={`arrow-${i}`} className="flex items-center shrink-0 px-0.5">
                        <ChevronRight className={cn('w-3.5 h-3.5 transition-colors duration-700',
                          stageIdx < activeIdx ? 'text-emerald-500/50' :
                          stageIdx === activeIdx ? 'text-indigo-400/60' :
                          'text-white/10'
                        )} />
                      </div>
                    )
                    return [card, arrow]
                  }
                  return [card]
                })}
              </div>

              {/* Live message */}
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400/60 shrink-0" />
                <span>{state.message}</span>
              </div>

              {/* Feedback loop indicator */}
              {state.iteration > 1 && (
                <div className="flex items-center gap-3 text-xs text-indigo-400/40">
                  <div className="flex-1 border-t border-dashed border-indigo-500/20" />
                  <span className="shrink-0">↩ Iteration {state.iteration} — gaps re-queried and re-scored</span>
                  <div className="flex-1 border-t border-dashed border-indigo-500/20" />
                </div>
              )}
            </div>
          )
        })}

        {/* Queued */}
        {queued.length > 0 && (
          <div className="border-t border-white/8 pt-4 space-y-2">
            <p className="text-xs text-white/25 font-medium uppercase tracking-wide">Queued</p>
            <div className="flex flex-wrap gap-2">
              {queued.map(c => (
                <span key={c} className="text-xs text-white/30 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Completed so far */}
        {results.length > 0 && (
          <div className="border-t border-white/8 pt-4 space-y-2">
            <p className="text-xs text-white/25 font-medium uppercase tracking-wide">Completed</p>
            <div className="flex flex-wrap gap-2">
              {results.map(r => (
                <span key={r.id} className={cn('text-xs rounded-lg px-2.5 py-1 flex items-center gap-1.5 font-medium',
                  r.score.status === 'DISQUALIFIED' ? 'text-red-400/70 bg-red-500/10' :
                  r.score.total >= 80 ? 'text-emerald-400 bg-emerald-500/10' :
                  r.score.total >= 60 ? 'text-amber-400 bg-amber-500/10' :
                  'text-white/30 bg-white/5'
                )}>
                  <CheckCircle className="w-3 h-3" />
                  {r.name}
                  {r.score.status !== 'DISQUALIFIED' && <strong className="ml-0.5">{r.score.total}</strong>}
                  {r.score.status === 'DISQUALIFIED' && <span className="text-red-400/60 ml-0.5">DQ</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Source footer */}
      <div className="px-6 py-3 border-t border-white/8 flex items-center gap-3 flex-wrap">
        <span className="text-white/20 text-xs">Active sources:</span>
        {['Exa.ai', 'Apollo', 'Brave Search', 'Gemini 2.0'].map(s => (
          <span key={s} className="text-xs text-white/30 px-2 py-0.5 rounded-full border border-white/10">{s}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Outreach Tabs ────────────────────────────────────────────────────────────

function OutreachContent({ brief, contact, phone }: {
  brief: CallBrief
  contact?: CompanyResult['contacts'][0]
  phone?: string
}) {
  const [tab, setTab] = useState<OutreachTab>('call')

  const tabs: { key: OutreachTab; label: string; Icon: typeof Phone }[] = [
    { key: 'call',     label: 'Call Script', Icon: Phone },
    { key: 'email',    label: 'Email',        Icon: Mail },
    { key: 'linkedin', label: 'LinkedIn',     Icon: Linkedin },
  ]

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              tab === key
                ? 'bg-primary text-white shadow-glow-primary'
                : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
            )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Call */}
      {tab === 'call' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1.5">Open With</p>
            <p className="text-sm leading-relaxed">&ldquo;{brief.openWith}&rdquo;</p>
            <div className="mt-2 flex justify-end">
              <CopyBtn text={brief.openWith} label="Copy opener" />
            </div>
          </div>

          {contact && (
            <div className="flex items-center gap-3 p-3 bg-surface-low rounded-xl">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {contact.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{contact.name}</p>
                <p className="text-xs text-on-surface-variant">{contact.title}</p>
              </div>
              {phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                  <Phone className="w-3 h-3" /> {phone}
                </a>
              )}
            </div>
          )}

          {brief.referenceOnCall?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Reference on the call</p>
              {brief.referenceOnCall.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2.5 bg-surface-low rounded-lg">
                  <span className="text-primary font-bold shrink-0">→</span>
                  <span className="flex-1">{r.point}</span>
                  {r.url && (
                    <a href={r.url.startsWith('http') ? r.url : `https://${r.url}`} target="_blank" rel="noreferrer" className="text-primary shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {brief.stillMissing?.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1.5">Research before calling</p>
              {brief.stillMissing.map((m, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-800 mb-1">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  {m.item} → <span className="font-semibold">{m.where}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email */}
      {tab === 'email' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-1">Subject Line</p>
            <p className="font-semibold text-sm">{brief.emailSubjectLine}</p>
            <div className="mt-1.5 flex justify-end">
              <CopyBtn text={brief.emailSubjectLine} label="Copy subject" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-outline-variant">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Full Email</p>
              <CopyBtn
                text={`Subject: ${brief.emailSubjectLine}\n\n${brief.personalizedFirstLine}\n\n${brief.emailBody ?? ''}`}
                label="Copy full email"
              />
            </div>
            <p className="text-sm leading-relaxed border-b border-outline-variant pb-3 mb-3 font-medium">
              {brief.personalizedFirstLine}
            </p>
            {brief.emailBody && (
              <div className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">
                {brief.emailBody}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LinkedIn */}
      {tab === 'linkedin' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1.5">Connection Request Note</p>
            <p className="text-sm leading-relaxed">{brief.linkedinConnectionNote ?? '(Generate brief to see this)'}</p>
            {brief.linkedinConnectionNote && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-blue-500">{brief.linkedinConnectionNote?.length ?? 0} / 100 chars</span>
                <CopyBtn text={brief.linkedinConnectionNote ?? ''} label="Copy note" />
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-outline-variant">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Direct Message (if connected)</p>
              {brief.linkedinDM && <CopyBtn text={brief.linkedinDM} label="Copy DM" />}
            </div>
            <p className="text-sm leading-relaxed">{brief.linkedinDM ?? '(Generate brief to see this)'}</p>
            {brief.linkedinDM && (
              <p className="text-xs text-on-surface-variant mt-2">{brief.linkedinDM.length} / 200 chars</p>
            )}
          </div>

          {contact?.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors">
              <Linkedin className="w-4 h-4" />
              Open {contact.name}&apos;s LinkedIn Profile
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Brief Panel ──────────────────────────────────────────────────────────────

function BriefPanel({ company, product }: { company: CompanyResult; product: string }) {
  const [brief, setBrief] = useState(company.callBrief)
  const [loading, setLoading] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const isDQ = company.score.status === 'DISQUALIFIED'
  const contact = company.contacts[0]
  const phone = contact?.phone || company.mainPhone

  async function loadBrief() {
    setLoading(true)
    try {
      const res = await fetch('/api/enrich', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, product }),
      })
      const { brief: b } = await res.json()
      setBrief(b)
      company.callBrief = b
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-outline-variant overflow-hidden animate-slide-in">
      {/* Top strip */}
      <div className={cn('px-6 py-3 flex items-center justify-between border-b border-outline-variant',
        isDQ ? 'bg-red-50' : 'bg-surface-low'
      )}>
        <div className="flex items-center gap-3">
          <PriorityBadge status={company.score.status} />
          <div>
            <span className="font-bold text-sm">{company.name}</span>
            <span className="text-on-surface-variant text-xs ml-2">{company.domain} · {company.industry}</span>
          </div>
        </div>
        <div className={cn('text-xl font-extrabold',
          isDQ ? 'text-red-500' :
          company.score.total >= 80 ? 'text-emerald-600' :
          company.score.total >= 60 ? 'text-amber-500' : 'text-slate-400'
        )}>
          {isDQ ? 'DQ' : `${company.score.total}/100`}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left col — pain + contact */}
        <div className="space-y-5">
          {isDQ ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-1.5">Why Disqualified</p>
              <p className="text-sm text-red-800 leading-relaxed">
                {company.score.dimensions[0]?.evidence ?? 'Hospital or health system — 12–18 month procurement cycles and committee buying structures fall outside our ICP.'}
              </p>
            </div>
          ) : (
            <>
              {/* Pain triggers */}
              {company.inputData.filter(d => d.type === 'Pain Point').length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Pain Triggers</p>
                  {company.inputData.filter(d => d.type === 'Pain Point').slice(0, 3).map((p, i) => (
                    <div key={i} className="flex gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <span className="text-red-400 font-bold text-xs shrink-0 mt-0.5">{i + 1}</span>
                      <div>
                        <p className="text-xs leading-relaxed">{p.value}</p>
                        {p.url && (
                          <a href={p.url.startsWith('http') ? p.url : `https://${p.url}`} target="_blank" rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                            Source <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Score breakdown */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Score Breakdown</p>
            {company.score.dimensions.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">{d.name}</span>
                  <span className={cn('font-bold',
                    d.score === 0 ? 'text-red-500' :
                    d.score / d.maxScore >= 0.8 ? 'text-emerald-600' :
                    d.score / d.maxScore >= 0.5 ? 'text-amber-600' : 'text-slate-400'
                  )}>{d.score}/{d.maxScore}</span>
                </div>
                <div className="h-1.5 bg-outline-variant rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-700',
                    d.score === 0 ? 'bg-red-300' :
                    d.score / d.maxScore >= 0.8 ? 'bg-emerald-500' :
                    d.score / d.maxScore >= 0.5 ? 'bg-amber-400' : 'bg-slate-300'
                  )} style={{ width: `${Math.round((d.score / d.maxScore) * 100)}%` }} />
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{d.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right col — outreach */}
        <div>
          {!isDQ && (
            !brief ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Generate Outreach Campaign</p>
                  <p className="text-xs text-on-surface-variant max-w-xs">AI writes a personalized call script, email, and LinkedIn message based on the intelligence above.</p>
                </div>
                <button onClick={loadBrief} disabled={loading}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-glow-primary disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Zap className="w-4 h-4" /> Generate Outreach</>}
                </button>
              </div>
            ) : (
              <OutreachContent brief={brief} contact={contact} phone={phone} />
            )
          )}
        </div>
      </div>

      {/* Raw data toggle */}
      <div className="px-6 pb-5">
        <button onClick={() => setShowRaw(s => !s)}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
          {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Raw intel table ({company.inputData.length} data points)
        </button>
        {showRaw && (
          <div className="mt-3 overflow-x-auto border border-outline-variant rounded-xl">
            <table className="w-full text-xs">
              <thead className="border-b border-outline-variant bg-surface-low">
                <tr>{['#','Source','Type','Value','Conf.','Link','Action'].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-semibold text-on-surface-variant">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {company.inputData.map((row) => (
                  <tr key={row.id} className={cn('border-b border-outline-variant/50', row.gap && 'bg-red-50')}>
                    <td className="py-2 px-3 text-on-surface-variant">{row.id}</td>
                    <td className="py-2 px-3 font-medium">{row.source}</td>
                    <td className="py-2 px-3">
                      <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium',
                        row.type === 'Pain Point' ? 'bg-red-100 text-red-700' :
                        row.type === 'Buying Signal' ? 'bg-emerald-100 text-emerald-700' :
                        row.type.startsWith('Contact') ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-600'
                      )}>{row.type}</span>
                    </td>
                    <td className="py-2 px-3 max-w-xs text-on-surface-variant">{row.value}</td>
                    <td className="py-2 px-3">
                      <span className={cn('font-semibold text-xs',
                        row.confidence === 'High' ? 'text-emerald-600' :
                        row.confidence === 'Medium' ? 'text-amber-600' : 'text-red-500'
                      )}>{row.confidence}</span>
                    </td>
                    <td className="py-2 px-3">
                      {row.url ? (
                        <a href={row.url.startsWith('http') ? row.url : `https://${row.url}`} target="_blank" rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-0.5">
                          Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3 text-on-surface-variant text-xs">{row.loopAction ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [campaignName, setCampaignName] = useState('')
  const [product, setProduct] = useState('')
  const [rows, setRows] = useState<CompanyRow[]>(DEFAULT_ROWS)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [results, setResults] = useState<CompanyResult[]>([])
  const [progress, setProgress] = useState<Record<string, ProgressInfo>>({})
  const [analyzingList, setAnalyzingList] = useState<string[]>([])
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const resultsRef = useRef<HTMLDivElement>(null)

  const validRows = rows.filter(r => r.name.trim())

  function updateRow(i: number, field: 'name' | 'website', value: string) {
    setRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r))
  }
  function removeRow(i: number) { setRows(prev => prev.filter((_, j) => j !== i)) }
  function addRow() { setRows(prev => [...prev, { name: '', website: '' }]) }

  function handlePasteImport() {
    const newRows = pasteText.trim().split('\n').filter(Boolean).map(line => {
      const [name = '', website = ''] = line.split('\t')
      return { name: name.trim(), website: website.trim() }
    }).filter(r => r.name)
    if (newRows.length) { setRows(newRows); setPasteText(''); setShowPaste(false) }
  }

  async function runAnalysis() {
    if (!validRows.length) return
    setRunStatus('running')
    setResults([])
    setProgress({})
    setActiveBriefId(null)
    setFilter('ALL')
    setAnalyzingList(validRows.map(r => r.name))

    const response = await fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies: validRows, product, campaignName }),
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'progress') {
            setProgress(p => ({ ...p, [event.company]: { step: event.step, message: event.message, iteration: event.iteration ?? 1 } }))
          } else if (event.type === 'result') {
            // Flash "done" on pipeline, then remove after 2s
            setProgress(p => ({ ...p, [event.company]: { step: 'done', message: 'Complete!', iteration: 3 } }))
            setTimeout(() => setProgress(p => { const n = { ...p }; delete n[event.company]; return n }), 2000)
            setResults(r => [...r, event.data].sort((a, b) => b.score.total - a.score.total))
          } else if (event.type === 'done') {
            setRunStatus('done')
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 500)
          }
        } catch {}
      }
    }
  }

  const qualified = results.filter(r => r.score.status !== 'DISQUALIFIED')
  const avg = qualified.length ? Math.round(qualified.reduce((s, r) => s + r.score.total, 0) / qualified.length) : null
  const counts: Record<Filter, number> = {
    ALL: results.length,
    HIGH: results.filter(r => r.score.status === 'CALL NOW').length,
    MED:  results.filter(r => r.score.status === 'SEQUENCE').length,
    LOW:  results.filter(r => r.score.status === 'DEPRIORITIZE').length,
    DQ:   results.filter(r => r.score.status === 'DISQUALIFIED').length,
  }
  const filtered =
    filter === 'HIGH' ? results.filter(r => r.score.status === 'CALL NOW') :
    filter === 'MED'  ? results.filter(r => r.score.status === 'SEQUENCE') :
    filter === 'LOW'  ? results.filter(r => r.score.status === 'DEPRIORITIZE') :
    filter === 'DQ'   ? results.filter(r => r.score.status === 'DISQUALIFIED') :
    results

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none tracking-tight">Outbound Intelligence Engine</h1>
            <p className="text-white/40 text-xs mt-0.5">Score · Enrich · Personalize</p>
          </div>
          {campaignName && (
            <div className="ml-auto flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-white/70 text-xs font-medium">{campaignName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign */}
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">Campaign Setup</h2>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Campaign Name</label>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="Q3 Healthcare Outreach"
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">What You&apos;re Selling</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3}
                placeholder="AI-powered referral and scheduling automation for PE-backed specialty groups..."
                className="w-full px-3 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">≥80 HIGH</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">60–79 MED</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 font-semibold border border-slate-200">&lt;60 LOW</span>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-semibold border border-red-200">Hospital = DQ</span>
            </div>
          </div>

          {/* Companies */}
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">Companies</h2>
              <span className="text-xs text-on-surface-variant font-medium">{validRows.length} companies</span>
            </div>

            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-low border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Company Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Website</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant/40 last:border-0 group">
                      <td className="px-2 py-1">
                        <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)}
                          placeholder="Company name"
                          className="w-full px-2 py-1 text-sm rounded-lg focus:outline-none focus:bg-primary-surface bg-transparent transition-colors" />
                      </td>
                      <td className="px-2 py-1">
                        <input value={row.website} onChange={e => updateRow(i, 'website', e.target.value)}
                          placeholder="domain.com"
                          className="w-full px-2 py-1 text-xs font-mono rounded-lg focus:outline-none focus:bg-primary-surface bg-transparent transition-colors text-on-surface-variant" />
                      </td>
                      <td className="pr-2">
                        <button onClick={() => removeRow(i)}
                          className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={addRow} className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2 py-1.5 rounded-lg hover:bg-surface-low transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
              <button onClick={() => setShowPaste(s => !s)} className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2 py-1.5 rounded-lg hover:bg-surface-low transition-colors">
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste from Sheets
              </button>
            </div>

            {showPaste && (
              <div className="space-y-2 animate-slide-in">
                <p className="text-xs text-on-surface-variant">Copy 2 columns (Name · Website) from Google Sheets and paste:</p>
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={3}
                  placeholder={"Elevate ENT Partners\televateent.com"}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
                <div className="flex gap-2">
                  <button onClick={handlePasteImport} disabled={!pasteText.trim()}
                    className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors">Import</button>
                  <button onClick={() => { setShowPaste(false); setPasteText('') }}
                    className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-low transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <button onClick={runAnalysis} disabled={!validRows.length || runStatus === 'running'}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
              {runStatus === 'running'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing {validRows.length} companies...</>
                : <><Zap className="w-4 h-4" /> Run Analysis →</>}
            </button>
          </div>
        </div>

        {/* Live Pipeline */}
        {(runStatus === 'running' || (runStatus === 'done' && Object.keys(progress).length > 0)) && (
          <LivePipeline progress={progress} allCompanies={analyzingList} results={results} />
        )}

        {/* Results */}
        {results.length > 0 && (
          <div ref={resultsRef} className="space-y-4 animate-slide-in">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-on-surface-variant">
                  <strong className="text-on-surface font-semibold">{results.length}</strong> companies
                </span>
                {avg !== null && (
                  <span className="text-on-surface-variant">
                    Avg <strong className="text-on-surface font-semibold">{avg}/100</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {(['ALL','HIGH','MED','LOW','DQ'] as Filter[]).map(f => (
                  <button key={f} onClick={() => { setFilter(f); setActiveBriefId(null) }}
                    className={cn('px-3 py-1.5 text-xs font-bold rounded-xl transition-all',
                      filter === f
                        ? f === 'HIGH' ? 'bg-emerald-500 text-white shadow-glow-green'
                          : f === 'MED' ? 'bg-amber-400 text-white'
                          : f === 'DQ'  ? 'bg-red-500 text-white'
                          : f === 'LOW' ? 'bg-slate-500 text-white'
                          : 'bg-on-surface text-white'
                        : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-low'
                    )}>
                    {f} {counts[f] > 0 && <span className="opacity-70 ml-0.5">({counts[f]})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-card border border-outline-variant overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-outline-variant">
                    <tr className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                      <th className="text-left py-3 px-4 w-20">Priority</th>
                      <th className="text-left py-3 px-4">Company</th>
                      <th className="py-3 px-2 text-center w-14">ICP<span className="opacity-40">/30</span></th>
                      <th className="py-3 px-2 text-center w-14">Pain<span className="opacity-40">/20</span></th>
                      <th className="py-3 px-2 text-center w-14">Scale<span className="opacity-40">/15</span></th>
                      <th className="py-3 px-2 text-center w-14">Cmte<span className="opacity-40">/15</span></th>
                      <th className="py-3 px-2 text-center w-14">Grwth<span className="opacity-40">/10</span></th>
                      <th className="py-3 px-2 text-center w-14">Msg<span className="opacity-40">/10</span></th>
                      <th className="text-left py-3 px-4">Pain Triggers</th>
                      <th className="text-left py-3 px-4 w-36">Phone</th>
                      <th className="py-3 px-4 text-center w-16">Score</th>
                      <th className="py-3 px-4 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const dims = r.score.dimensions
                      const painTriggers = r.inputData.filter(d => d.type === 'Pain Point').slice(0, 2).map(d => d.value.slice(0, 55))
                      const phone = r.contacts[0]?.phone || r.mainPhone
                      const isDQ = r.score.status === 'DISQUALIFIED'
                      const isActive = activeBriefId === r.id

                      return [
                        <tr key={r.id} className={cn(
                          'border-b border-outline-variant/50 transition-colors',
                          isActive ? 'bg-primary-surface' :
                          isDQ     ? 'bg-red-50/40' :
                                     'hover:bg-surface-low'
                        )}>
                          <td className="py-3 px-4"><PriorityBadge status={r.score.status} /></td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-sm">{r.name}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{r.domain}</div>
                          </td>
                          {dims.map(d => (
                            <td key={d.name} className="py-3 px-2">
                              <ScoreCell score={d.score} max={d.maxScore} />
                            </td>
                          ))}
                          {Array.from({ length: Math.max(0, 6 - dims.length) }).map((_, i) => <td key={`pad-${i}`} />)}
                          <td className="py-3 px-4 max-w-[200px]">
                            {painTriggers.length > 0 ? (
                              <div className="space-y-0.5">
                                {painTriggers.map((p, i) => (
                                  <div key={i} className="text-xs text-on-surface-variant leading-relaxed">
                                    · {p}{p.length >= 55 ? '…' : ''}
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-xs text-on-surface-variant">—</span>}
                          </td>
                          <td className="py-3 px-4">
                            {phone ? (
                              <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
                                <Phone className="w-3 h-3" /> {phone}
                              </a>
                            ) : <span className="text-xs text-on-surface-variant">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={cn('text-lg font-extrabold',
                              isDQ ? 'text-red-400' :
                              r.score.total >= 80 ? 'text-emerald-600' :
                              r.score.total >= 60 ? 'text-amber-500' : 'text-slate-400'
                            )}>
                              {isDQ ? '—' : r.score.total}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => setActiveBriefId(isActive ? null : r.id)}
                              className={cn('px-3 py-1.5 text-xs font-semibold rounded-xl transition-all',
                                isActive ? 'bg-on-surface text-white' :
                                isDQ     ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                                r.score.status === 'CALL NOW' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' :
                                'bg-surface-container text-on-surface-variant hover:bg-surface-low'
                              )}>
                              {isActive ? 'Close' : isDQ ? 'Why DQ?' : r.score.status === 'CALL NOW' ? 'Outreach →' : 'Details'}
                            </button>
                          </td>
                        </tr>,
                        isActive && (
                          <tr key={`brief-${r.id}`}>
                            <td colSpan={13} className="px-4 pb-5 pt-1">
                              <BriefPanel company={r} product={product} />
                            </td>
                          </tr>
                        )
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-outline-variant mt-16 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-on-surface-variant">
          <span>Sources: Exa · Apollo · Brave · Gemini · OpenAI</span>
          <span className="font-medium">Outbound Intelligence Engine · 2026</span>
        </div>
      </footer>
    </div>
  )
}
