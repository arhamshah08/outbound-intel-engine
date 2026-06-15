'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap,
  Phone, Loader2, Plus, X, ClipboardPaste,
  Search, Database, Users, Target, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompanyResult } from '@/lib/types'
import DecideModal     from '@/components/DecideModal'
import DatabaseSetup   from '@/components/DatabaseSetup'
import NetworkHero     from '@/components/NetworkHero'

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
type ProgressInfo  = { step: string; message: string; iteration: number; snippets: string[] }

// ─── Small helpers ────────────────────────────────────────────────────────────

function priority(status: CompanyResult['score']['status']): Filter {
  if (status === 'CALL NOW')     return 'HIGH'
  if (status === 'SEQUENCE')     return 'MED'
  if (status === 'DISQUALIFIED') return 'DQ'
  return 'LOW'
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

  const doneSet    = new Set(results.map(r => r.name))
  const inProgress = Object.entries(progress).filter(([, s]) => s.step !== 'done')
  const queued     = allCompanies.filter(c => !doneSet.has(c) && !progress[c])

  const STAGE_LABELS: Record<string, string> = {
    discover: 'Discover', enrich: 'Enrich', contacts: 'Contacts',
    'deep-dive': 'Deep Dive', scoring: 'Score',
  }
  const STAGE_KEYS = ['discover', 'enrich', 'contacts', 'deep-dive', 'scoring']

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <span className="font-semibold text-sm text-foreground">Intelligence Engine</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{elapsed}s elapsed</span>
          <span>{inProgress.length} running · {queued.length} queued · {results.length} done</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {/* In-progress companies */}
        {inProgress.map(([company, state]) => {
          const activeIdx = STAGE_ORDER.indexOf(state.step)
          return (
            <div key={company} className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{company}</span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                  {STAGE_LABELS[state.step] ?? 'Processing'}
                </span>
              </div>

              {/* Stage pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {STAGE_KEYS.map((key, i) => {
                  const stageIdx = STAGE_ORDER.indexOf(key)
                  const isDone   = stageIdx < activeIdx
                  const isActive = stageIdx === activeIdx
                  return (
                    <span key={key} className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all',
                      isDone   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isActive ? 'bg-foreground text-background border-foreground' :
                                 'text-muted-foreground border-border bg-transparent'
                    )}>
                      {isDone ? '✓ ' : isActive ? '● ' : ''}{STAGE_LABELS[key]}
                    </span>
                  )
                })}
                {state.iteration > 1 && (
                  <span className="px-2 py-0.5 text-xs text-muted-foreground border border-border rounded-full">
                    Loop {state.iteration}
                  </span>
                )}
              </div>

              {/* Live message */}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                {state.message}
              </p>

              {/* Latest snippet */}
              {state.snippets[0] && (
                <p className="text-xs text-muted-foreground/70 pl-4 border-l-2 border-border">
                  {state.snippets[0]}
                </p>
              )}
            </div>
          )
        })}

        {/* Queued */}
        {queued.length > 0 && (
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">Queued</span>
            <div className="flex flex-wrap gap-1.5">
              {queued.map(c => (
                <span key={c} className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-0.5">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {results.length > 0 && (
          <div className="px-5 py-3 flex items-start gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0 mt-0.5">Done</span>
            <div className="flex flex-wrap gap-1.5">
              {results.map(r => (
                <span key={r.id} className={cn(
                  'text-xs rounded-full px-2.5 py-0.5 flex items-center gap-1 font-medium border',
                  r.score.status === 'DISQUALIFIED' ? 'text-red-600 bg-red-50 border-red-200' :
                  r.score.total >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  r.score.total >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-muted-foreground bg-muted border-border'
                )}>
                  <CheckCircle className="w-3 h-3" />
                  {r.name}
                  {r.score.status !== 'DISQUALIFIED' && <strong className="ml-0.5">{r.score.total}</strong>}
                  {r.score.status === 'DISQUALIFIED' && <span className="ml-0.5">DQ</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const VH_CAMPAIGN = 'Valerie Health — PE Specialty Groups'
const VH_PRODUCT  = 'Valerie Health automates referral management, scheduling, and patient intake for PE-backed specialty physician groups. We cut front-office overhead, improve referral capture rates, and integrate with existing EMRs in under 30 days. ICP: PE-backed groups with 10–200 physicians across orthopedics, dermatology, gastroenterology, and behavioral health.'
const VH_TAGS     = ['PE-backed', 'Specialty Physician', '10–200 physicians', 'No hospital systems']

export default function Home() {
  const router = useRouter()
  const [campaignName, setCampaignName] = useState(VH_CAMPAIGN)
  const [product, setProduct]           = useState(VH_PRODUCT)
  const [icpTags, setIcpTags]           = useState<string[]>(VH_TAGS)
  const [tagInput, setTagInput]         = useState('')
  const [rows, setRows]                 = useState<CompanyRow[]>(DEFAULT_ROWS)
  const [addedToast, setAddedToast]     = useState<string | null>(null)
  const [showPaste, setShowPaste]       = useState(false)
  const [pasteText, setPasteText]       = useState('')
  const [runStatus, setRunStatus]       = useState<'idle' | 'running' | 'done'>('idle')
  const [results, setResults]           = useState<CompanyResult[]>([])
  const [progress, setProgress]         = useState<Record<string, ProgressInfo>>({})
  const [analyzingList, setAnalyzingList] = useState<string[]>([])
  const [filter, setFilter]             = useState<Filter>('ALL')
  const [locationFilter, setLocationFilter] = useState('')
  const [decideTarget, setDecideTarget] = useState<CompanyResult | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('vhCampaign')
    if (saved) setCampaignName(saved)
  }, [])
  useEffect(() => {
    const saved = localStorage.getItem('vhProduct')
    if (saved) setProduct(saved)
  }, [])
  useEffect(() => {
    const saved = localStorage.getItem('vhTags')
    if (saved) { try { setIcpTags(JSON.parse(saved)) } catch {} }
  }, [])
  useEffect(() => { localStorage.setItem('vhCampaign', campaignName) }, [campaignName])
  useEffect(() => { localStorage.setItem('vhProduct', product) }, [product])
  useEffect(() => { localStorage.setItem('vhTags', JSON.stringify(icpTags)) }, [icpTags])

  const validRows = rows.filter(r => r.name.trim())

  function addTag() {
    const t = tagInput.trim()
    if (t && !icpTags.includes(t)) setIcpTags(prev => [...prev, t])
    setTagInput('')
  }
  function removeTag(tag: string) { setIcpTags(prev => prev.filter(t => t !== tag)) }

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
    setFilter('ALL')
    setAnalyzingList(validRows.map(r => r.name))

    const response = await fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies: validRows, product, campaignName, tags: icpTags }),
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
            setProgress(p => {
              const prev = p[event.company]
              const newSnippets = event.snippet
                ? [event.snippet, ...(prev?.snippets ?? [])].slice(0, 5)
                : (prev?.snippets ?? [])
              return { ...p, [event.company]: { step: event.step, message: event.message, iteration: event.iteration ?? 1, snippets: newSnippets } }
            })
          } else if (event.type === 'result') {
            // Flash "done" on pipeline, then remove after 2s
            setProgress(p => ({ ...p, [event.company]: { step: 'done', message: 'Complete!', iteration: 3, snippets: p[event.company]?.snippets ?? [] } }))
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
  const filtered = results
    .filter(r =>
      filter === 'HIGH' ? r.score.status === 'CALL NOW' :
      filter === 'MED'  ? r.score.status === 'SEQUENCE' :
      filter === 'LOW'  ? r.score.status === 'DEPRIORITIZE' :
      filter === 'DQ'   ? r.score.status === 'DISQUALIFIED' :
      true
    )
    .filter(r =>
      !locationFilter.trim() || (r.location ?? '').toLowerCase().includes(locationFilter.toLowerCase())
    )

  return (
    <div className="space-y-6">
      <DatabaseSetup />

      {decideTarget && (
        <DecideModal
          company={decideTarget}
          campaignName={campaignName}
          product={product}
          onClose={() => setDecideTarget(null)}
          onAdded={() => {
            const name = decideTarget?.name ?? 'Company'
            setDecideTarget(null)
            setAddedToast(name)
            setTimeout(() => {
              setAddedToast(null)
              router.push('/pipeline')
            }, 1500)
          }}
        />
      )}

      <div className="space-y-6">
        <>

        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <NetworkHero />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign */}
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h2 className="font-semibold text-sm text-on-surface tracking-tight">Campaign Setup</h2>
              </div>
              <button
                onClick={() => { setCampaignName(VH_CAMPAIGN); setProduct(VH_PRODUCT); setIcpTags(VH_TAGS) }}
                className="text-xs font-semibold text-primary hover:underline opacity-50 hover:opacity-100 transition-opacity"
              >
                ↺ VH Defaults
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70 mb-1.5">Campaign Name</label>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="Q3 Healthcare Outreach"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50/50" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70 mb-1.5">What You&apos;re Selling</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3}
                placeholder="AI-powered referral and scheduling automation for PE-backed specialty groups..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none bg-slate-50/50" />
            </div>

            {/* ICP Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70 mb-2">ICP Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {icpTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200/60">
                    {tag}
                    <button onClick={() => removeTag(tag)}
                      className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors leading-none">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add a tag…"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50/50" />
                <button onClick={addTag} disabled={!tagInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/60 hover:bg-indigo-100 disabled:opacity-40 transition-colors">
                  + Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-outline-variant/40">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">≥80 HIGH</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">60–79 MED</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-semibold border border-slate-200">&lt;60 LOW</span>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-200/60">Hospital = DQ</span>
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
            {/* Metrics + Filter bar */}
            <div className="space-y-3">
              {/* Metric chips */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-xs">
                  <span className="text-muted-foreground">Analyzed</span>
                  <strong className="text-foreground">{results.length}</strong>
                </div>
                {avg !== null && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-xs">
                    <span className="text-muted-foreground">Avg score</span>
                    <strong className="text-foreground">{avg}/100</strong>
                  </div>
                )}
                {counts.HIGH > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <span className="text-emerald-700">Call Now</span>
                    <strong className="text-emerald-800">{counts.HIGH}</strong>
                  </div>
                )}
                {counts.MED > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                    <span className="text-amber-700">Sequence</span>
                    <strong className="text-amber-800">{counts.MED}</strong>
                  </div>
                )}
                {counts.DQ > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs">
                    <span className="text-red-600">DQ</span>
                    <strong className="text-red-700">{counts.DQ}</strong>
                  </div>
                )}
              </div>

              {/* Filter row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setResults([]); setProgress({}); setRunStatus('idle'); setAnalyzingList([]) }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                    Clear
                  </button>
                  <div className="w-px h-4 bg-border" />
                  {(['ALL','HIGH','MED','LOW','DQ'] as Filter[]).map(f => (
                    <button key={f} onClick={() => { setFilter(f) }}
                      className={cn('px-3 py-1.5 text-xs font-bold rounded-xl transition-all',
                        filter === f
                          ? f === 'HIGH' ? 'bg-emerald-600 text-white'
                            : f === 'MED' ? 'bg-amber-500 text-white'
                            : f === 'DQ'  ? 'bg-red-500 text-white'
                            : f === 'LOW' ? 'bg-foreground/70 text-background'
                            : 'bg-foreground text-background'
                          : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                      )}>
                      {f} {counts[f] > 0 && <span className="opacity-70 ml-0.5">({counts[f]})</span>}
                    </button>
                  ))}
                </div>

                {/* Location filter */}
                <input
                  type="text"
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  placeholder="Filter by location…"
                  className="px-3 py-1.5 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 w-44 placeholder:text-muted-foreground/60"
                />
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
                      const painTriggers = r.inputData.filter(d => d.type === 'Pain Point').slice(0, 2)
                      const phone = r.contacts[0]?.phone || r.mainPhone
                      const isDQ = r.score.status === 'DISQUALIFIED'

                      return (
                        <tr key={r.id} className={cn(
                          'border-b border-outline-variant/50 transition-colors',
                          isDQ ? 'bg-red-50/40' : 'hover:bg-surface-low'
                        )}>
                          <td className="py-3 px-4"><PriorityBadge status={r.score.status} /></td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-sm">{r.name}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{r.domain}</div>
                            {r.location && <div className="text-xs text-on-surface-variant/70 mt-0.5">{r.location}</div>}
                          </td>
                          {dims.map(d => (
                            <td key={d.name} className="py-3 px-2">
                              <ScoreCell score={d.score} max={d.maxScore} />
                            </td>
                          ))}
                          {Array.from({ length: Math.max(0, 6 - dims.length) }).map((_, i) => <td key={`pad-${i}`} />)}
                          <td className="py-3 px-4 max-w-[200px]">
                            {painTriggers.length > 0 ? (
                              <div className="space-y-1.5">
                                {painTriggers.map((p, i) => (
                                  <div key={i} className="text-xs text-on-surface-variant leading-relaxed">
                                    <span>· {p.value.slice(0, 55)}{p.value.length >= 55 ? '…' : ''}</span>
                                    {p.url && (
                                      <a href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
                                        target="_blank" rel="noreferrer"
                                        className="ml-1 text-primary/50 hover:text-primary transition-colors text-xs">↗</a>
                                    )}
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
                            <button onClick={() => setDecideTarget(r)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-80 border border-transparent transition-all">
                              + Pipeline
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>
      </div>

      {/* Success toast */}
      {addedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span><strong>{addedToast}</strong> added to Pipeline</span>
          </div>
        </div>
      )}
    </div>
  )
}
