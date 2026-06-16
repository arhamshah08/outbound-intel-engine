'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Loader2,
  Phone, Plus, X, ClipboardPaste, RotateCcw,
  Search, Database, Users, Target, CheckCircle, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompanyResult } from '@/lib/types'
import { supabase }    from '@/lib/supabase'
import { getCached, setCached, clearCachedFor } from '@/lib/scoreCache'
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
  { key: 'scoring',  label: 'Score',      Icon: Sparkles, desc: 'Gemini · 6 dimensions' },
]
const STAGE_ORDER = ['discover', 'enrich', 'contacts', 'deep-dive', 'scoring', 'done']

type CompanyRow    = { name: string; website: string }
type Filter        = 'ALL' | 'HIGH' | 'MED' | 'LOW' | 'DQ' | 'INSUFFICIENT'
type ProgressInfo  = { step: string; message: string; iteration: number; snippets: string[] }

// ─── Small helpers ────────────────────────────────────────────────────────────

function priority(status: CompanyResult['score']['status']): Filter {
  if (status === 'CALL NOW')     return 'HIGH'
  if (status === 'SEQUENCE')     return 'MED'
  if (status === 'DISQUALIFIED') return 'DQ'
  if (status === 'INSUFFICIENT') return 'INSUFFICIENT'
  return 'LOW'
}

function PriorityBadge({ status }: { status: CompanyResult['score']['status'] }) {
  const p = priority(status)
  if (p === 'INSUFFICIENT') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-amber-100 text-amber-800 border border-amber-300">
        NEED DATA
      </span>
    )
  }
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
      p === 'HIGH' ? 'bg-emerald-500 text-white' :
      p === 'MED'  ? 'bg-amber-400 text-white' :
      p === 'DQ'   ? 'bg-red-100 text-red-600' :
                     'bg-slate-100 text-slate-500'
    )}>{p}</span>
  )
}

function SourcesBadge({ count }: { count: number | undefined }) {
  if (count === undefined) return null
  const tone =
    count >= 6 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    count >= 3 ? 'bg-slate-50 text-slate-600 border-slate-200' :
                 'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <span
      title={`${count} distinct sources cited`}
      className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border tabular-nums', tone)}
    >
      {count} src
    </span>
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
                  r.score.status === 'INSUFFICIENT' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  r.score.total >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  r.score.total >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-muted-foreground bg-muted border-border'
                )}>
                  <CheckCircle className="w-3 h-3" />
                  {r.name}
                  {r.score.status === 'DISQUALIFIED' && <span className="ml-0.5">DQ</span>}
                  {r.score.status === 'INSUFFICIENT' && <span className="ml-0.5">need data</span>}
                  {r.score.status !== 'DISQUALIFIED' && r.score.status !== 'INSUFFICIENT' && <strong className="ml-0.5">{r.score.total}</strong>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pipeline Button ──────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function PipelineButton({
  company, campaignName, product,
}: {
  company: CompanyResult
  campaignName: string
  product: string
}) {
  const [added,      setAdded]      = useState(false)
  const [flipping,   setFlipping]   = useState(false)
  const [prospectId, setProspectId] = useState<string | null>(null)

  async function toggle() {
    if (flipping) return
    const nextAdded = !added

    // Flip animation: squish → swap content → unsquish
    setFlipping(true)
    await sleep(140)
    setAdded(nextAdded)
    await sleep(16)
    setFlipping(false)

    if (nextAdded) {
      const savedProduct = typeof window !== 'undefined'
        ? localStorage.getItem('vhProduct') ?? product
        : product
      const { data, error } = await supabase.from('prospects').insert({
        company_name:     company.name,
        domain:           company.domain,
        industry:         company.industry,
        headcount:        company.headcount,
        funding:          company.funding,
        location:         company.location ?? '',
        description:      company.description,
        score:            company.score.total,
        score_status:     company.score.status,
        score_dimensions: company.score.dimensions,
        approach:         ['call', 'email', 'linkedin'],
        status:           'active',
        contacts:         company.contacts,
        pain_points:      company.inputData.filter(d => d.type === 'Pain Point'),
        notes:            '',
        campaign_name:    campaignName,
      }).select('id').single()

      if (error || !data) {
        // Revert on failure
        setFlipping(true)
        await sleep(140)
        setAdded(false)
        setProspectId(null)
        await sleep(16)
        setFlipping(false)
        return
      }
      setProspectId(data.id)
      // Generate brief in background
      fetch('/api/enrich', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, product: savedProduct, prospectId: data.id }),
      }).catch(() => {})
    } else {
      const id = prospectId
      setProspectId(null)
      if (id) supabase.from('prospects').delete().eq('id', id).then(() => {})
    }
  }

  return (
    <button
      onClick={toggle}
      title={added ? 'Click to remove from pipeline' : 'Add to pipeline'}
      style={{
        transform:  flipping ? 'scaleX(0)' : 'scaleX(1)',
        transition: 'transform 0.14s ease-in-out',
      }}
      className={cn(
        'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors duration-150 whitespace-nowrap',
        added
          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-red-500 hover:border-red-500'
          : 'bg-foreground text-background border-transparent hover:opacity-80'
      )}>
      {added
        ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Added</span>
        : '+ Pipeline'}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const VH_CAMPAIGN = 'Valerie Health — PE Specialty Groups'
const VH_PRODUCT  = 'Valerie Health automates referral management, scheduling, and patient intake for PE-backed specialty physician groups. We cut front-office overhead, improve referral capture rates, and integrate with existing EMRs in under 30 days. ICP: PE-backed groups with 10–200 physicians across orthopedics, dermatology, gastroenterology, and behavioral health.'
const VH_TAGS     = ['PE-backed', 'Specialty Physician', '10–200 physicians', 'No hospital systems']

export default function Home() {
  const [campaignName, setCampaignName] = useState(VH_CAMPAIGN)
  const [product, setProduct]           = useState(VH_PRODUCT)
  const [icpTags, setIcpTags]           = useState<string[]>(VH_TAGS)
  const [tagInput, setTagInput]         = useState('')
  const [rows, setRows]                 = useState<CompanyRow[]>(DEFAULT_ROWS)
  const [showPaste, setShowPaste]       = useState(false)
  const [pasteText, setPasteText]       = useState('')
  const [runStatus, setRunStatus]       = useState<'idle' | 'running' | 'done'>('idle')
  const [results, setResults]           = useState<CompanyResult[]>([])
  const [progress, setProgress]         = useState<Record<string, ProgressInfo>>({})
  const [analyzingList, setAnalyzingList] = useState<string[]>([])
  const [filter, setFilter]             = useState<Filter>('ALL')
  const [locationFilter, setLocationFilter] = useState('')
  // Per-row overrides keyed by company name. When the user fills in a missing
  // field chip, we stash the value here and pass it to enrichCompany on re-run.
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({})
  const [editingChip, setEditingChip] = useState<{ company: string; field: string } | null>(null)
  const [chipDraft, setChipDraft] = useState('')
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

  async function submitChipValue(companyName: string, field: string, value: string) {
    const v = value.trim()
    if (!v) return
    setEditingChip(null)
    setChipDraft('')

    if (field === 'domain') {
      // Domain isn't an override — it's the row's website. Patch the row.
      setRows(prev => prev.map(r => r.name === companyName ? { ...r, website: v } : r))
    } else {
      setOverrides(prev => ({
        ...prev,
        [companyName]: { ...(prev[companyName] ?? {}), [field]: v },
      }))
    }

    // Bust cache for this company and force re-enrichment with the new value.
    const row = validRows.find(r => r.name === companyName)
    if (row) await clearCachedFor(row.website || row.name, product, icpTags)
    await runAnalysis({ forceRows: [companyName] })
  }

  function handlePasteImport() {
    const newRows = pasteText.trim().split('\n').filter(Boolean).map(line => {
      const [name = '', website = ''] = line.split('\t')
      return { name: name.trim(), website: website.trim() }
    }).filter(r => r.name)
    if (newRows.length) { setRows(newRows); setPasteText(''); setShowPaste(false) }
  }

  async function runAnalysis(opts: { forceRows?: string[] } = {}) {
    if (!validRows.length) return
    setRunStatus('running')
    setProgress({})
    setFilter('ALL')

    // Check cache per company. Cached rows skip the API call entirely and reuse
    // the previously-computed score so rankings stay stable across runs.
    // "Re-score" button passes forceRows to bypass cache for specific companies.
    const forceSet = new Set(opts.forceRows ?? [])
    const cachedResults: CompanyResult[] = []
    const rowsToFetch: CompanyRow[] = []

    for (const row of validRows) {
      const domainKey = row.website || row.name
      const cached = forceSet.has(row.name)
        ? null
        : await getCached(domainKey, product, icpTags)
      if (cached) {
        cachedResults.push(cached)
      } else {
        rowsToFetch.push(row)
      }
    }

    setResults(cachedResults.slice().sort((a, b) => b.score.total - a.score.total))
    setAnalyzingList(rowsToFetch.map(r => r.name))

    if (rowsToFetch.length === 0) {
      // Everything was cached. Nothing to fetch — show results immediately.
      setRunStatus('done')
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
      return
    }

    const response = await fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companies: rowsToFetch.map(r => ({
          ...r,
          overrides: overrides[r.name] && Object.keys(overrides[r.name]).length > 0 ? overrides[r.name] : undefined,
        })),
        product,
        campaignName,
        tags: icpTags,
      }),
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
            // Persist to 24h cache so re-runs of the same campaign reuse the score
            const row = validRows.find(r => r.name === event.company)
            if (row && event.data) {
              const domainKey = row.website || row.name
              void setCached(domainKey, product, icpTags, event.data as CompanyResult)
            }
            setResults(r => [...r.filter(x => x.name !== event.company), event.data].sort((a, b) => b.score.total - a.score.total))
          } else if (event.type === 'done') {
            setRunStatus('done')
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 500)
          }
        } catch {}
      }
    }
  }

  const qualified = results.filter(r => r.score.status !== 'DISQUALIFIED' && r.score.status !== 'INSUFFICIENT')
  const avg = qualified.length ? Math.round(qualified.reduce((s, r) => s + r.score.total, 0) / qualified.length) : null
  const counts: Record<Filter, number> = {
    ALL: results.length,
    HIGH: results.filter(r => r.score.status === 'CALL NOW').length,
    MED:  results.filter(r => r.score.status === 'SEQUENCE').length,
    LOW:  results.filter(r => r.score.status === 'DEPRIORITIZE').length,
    DQ:   results.filter(r => r.score.status === 'DISQUALIFIED').length,
    INSUFFICIENT: results.filter(r => r.score.status === 'INSUFFICIENT').length,
  }
  const filtered = results
    .filter(r =>
      filter === 'HIGH' ? r.score.status === 'CALL NOW' :
      filter === 'MED'  ? r.score.status === 'SEQUENCE' :
      filter === 'LOW'  ? r.score.status === 'DEPRIORITIZE' :
      filter === 'DQ'   ? r.score.status === 'DISQUALIFIED' :
      filter === 'INSUFFICIENT' ? r.score.status === 'INSUFFICIENT' :
      true
    )
    .filter(r =>
      !locationFilter.trim() || (r.location ?? '').toLowerCase().includes(locationFilter.toLowerCase())
    )

  return (
    <div className="space-y-6">
      <DatabaseSetup />

      <div className="space-y-6">
        <>

        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <NetworkHero />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign */}
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-foreground/70" />
                </div>
                <h2 className="font-semibold text-sm text-on-surface tracking-tight">Campaign Setup</h2>
              </div>
              <button
                onClick={() => { setCampaignName(VH_CAMPAIGN); setProduct(VH_PRODUCT); setIcpTags(VH_TAGS) }}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:underline transition-colors"
              >
                ↺ VH Defaults
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70 mb-1.5">Campaign Name</label>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="Q3 Healthcare Outreach"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15 focus:border-foreground/40 transition-all bg-surface-low/60" />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">What You&apos;re Selling</label>
                <span className="text-[10px] text-on-surface-variant/50 tabular-nums">{product.length} chars</span>
              </div>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={4}
                placeholder="AI-powered referral and scheduling automation for PE-backed specialty groups..."
                className="w-full px-3.5 py-3 rounded-xl border border-outline-variant text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-foreground/15 focus:border-foreground/40 transition-all resize-none bg-surface-low/60" />
              <p className="text-[11px] text-on-surface-variant/60 mt-1.5">
                A clear product pitch helps the AI generate sharper outreach scripts.
              </p>
            </div>

            {/* ICP Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70 mb-2">ICP Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {icpTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/5 text-foreground text-xs font-medium border border-outline-variant">
                    {tag}
                    <button onClick={() => removeTag(tag)}
                      className="ml-0.5 text-on-surface-variant hover:text-foreground transition-colors leading-none">
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
                  className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant text-xs focus:outline-none focus:ring-2 focus:ring-foreground/15 focus:border-foreground/40 transition-all bg-surface-low/60" />
                <button onClick={addTag} disabled={!tagInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity">
                  + Add
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Score legend</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-800">≥ 80 · Call now</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/70 border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-800">60–79 · Sequence</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-low border border-outline-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50" />
                  <span className="text-[11px] font-semibold text-on-surface-variant">&lt; 60 · Deprioritize</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-50/70 border border-red-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[11px] font-semibold text-red-700">Hospital = DQ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Companies */}
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">Companies</h2>
              <span className="text-xs text-on-surface-variant font-medium">{validRows.length} companies</span>
            </div>

            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-surface-low border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Company Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Website</th>
                    <th className="w-10" />
                  </tr>
                </thead>
              </table>
              <div className="max-h-[260px] overflow-y-auto">
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-outline-variant/40 last:border-0 group">
                        <td className="px-2 py-1">
                          <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)}
                            placeholder="Company name"
                            className="w-full px-2 py-1 text-sm rounded-lg focus:outline-none focus:bg-surface-low bg-transparent transition-colors" />
                        </td>
                        <td className="px-2 py-1">
                          <input value={row.website} onChange={e => updateRow(i, 'website', e.target.value)}
                            placeholder="domain.com"
                            className="w-full px-2 py-1 text-xs font-mono rounded-lg focus:outline-none focus:bg-surface-low bg-transparent transition-colors text-on-surface-variant" />
                        </td>
                        <td className="pr-2 w-10">
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

            <button onClick={() => runAnalysis()} disabled={!validRows.length || runStatus === 'running'}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
              {runStatus === 'running'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing {validRows.length} companies...</>
                : <>Run Analysis →</>}
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
            {/* Unified summary + filter bar */}
            <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
              {/* Top: summary metrics */}
              <div className="flex items-center divide-x divide-outline-variant/60 bg-surface-low/40">
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Analyzed</p>
                  <p className="text-lg font-extrabold text-on-surface leading-tight">{results.length}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Avg score</p>
                  <p className="text-lg font-extrabold text-on-surface leading-tight tabular-nums">{avg ?? '—'}<span className="text-xs font-semibold text-on-surface-variant/60">/100</span></p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">Call now</p>
                  <p className="text-lg font-extrabold text-emerald-700 leading-tight tabular-nums">{counts.HIGH}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/80">Sequence</p>
                  <p className="text-lg font-extrabold text-amber-700 leading-tight tabular-nums">{counts.MED}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Low</p>
                  <p className="text-lg font-extrabold text-on-surface-variant leading-tight tabular-nums">{counts.LOW}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-700/80">DQ</p>
                  <p className="text-lg font-extrabold text-red-600 leading-tight tabular-nums">{counts.DQ}</p>
                </div>
                <div className="ml-auto px-3">
                  <button
                    onClick={() => { setResults([]); setProgress({}); setRunStatus('idle'); setAnalyzingList([]) }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all">
                    Clear results
                  </button>
                </div>
              </div>

              {/* Bottom: filters */}
              <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-outline-variant/60">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mr-1">Filter</span>
                <div className="flex items-center gap-1">
                  {(['ALL','HIGH','MED','LOW','DQ','INSUFFICIENT'] as Filter[]).map(f => (
                    <button key={f} onClick={() => { setFilter(f) }}
                      className={cn('px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                        filter === f
                          ? 'bg-foreground text-background'
                          : 'text-on-surface-variant hover:bg-surface-low'
                      )}>
                      {f === 'ALL' ? 'All'
                        : f === 'HIGH' ? 'Call now'
                        : f === 'MED' ? 'Sequence'
                        : f === 'LOW' ? 'Low'
                        : f === 'DQ' ? 'DQ'
                        : 'Need data'}
                      {counts[f] > 0 && <span className="ml-1 opacity-60 tabular-nums">{counts[f]}</span>}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    placeholder="Filter by location…"
                    className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface-low/60 focus:outline-none focus:ring-2 focus:ring-foreground/15 focus:border-foreground/40 w-48 placeholder:text-on-surface-variant/50"
                  />
                </div>
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
                      const isInsufficient = r.score.status === 'INSUFFICIENT'

                      return (
                        <tr key={r.id} className={cn(
                          'border-b border-outline-variant/50 transition-colors',
                          isDQ ? 'bg-red-50/40' :
                          isInsufficient ? 'bg-amber-50/30' : 'hover:bg-surface-low'
                        )}>
                          <td className="py-3 px-4"><PriorityBadge status={r.score.status} /></td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm">{r.name}</div>
                              <SourcesBadge count={r.score.sourceCount} />
                            </div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{r.domain}</div>
                            {r.location && <div className="text-xs text-on-surface-variant/70 mt-0.5">{r.location}</div>}
                            {r.missingFields && r.missingFields.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1 max-w-[320px]">
                                {r.missingFields.map(m => {
                                  const isEditing = editingChip?.company === r.name && editingChip?.field === m.field
                                  if (isEditing) {
                                    return (
                                      <span key={m.field} className="inline-flex items-center gap-1">
                                        <input
                                          autoFocus
                                          value={chipDraft}
                                          onChange={e => setChipDraft(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') { e.preventDefault(); void submitChipValue(r.name, m.field, chipDraft) }
                                            if (e.key === 'Escape') { setEditingChip(null); setChipDraft('') }
                                          }}
                                          placeholder={m.label}
                                          className="text-[11px] px-1.5 py-0.5 border border-amber-400 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 min-w-[180px]"
                                        />
                                        <button
                                          onClick={() => void submitChipValue(r.name, m.field, chipDraft)}
                                          className="text-[10px] font-semibold text-amber-800 hover:text-amber-900"
                                        >✓</button>
                                        <button
                                          onClick={() => { setEditingChip(null); setChipDraft('') }}
                                          className="text-[10px] text-amber-700/60 hover:text-amber-800"
                                        >✕</button>
                                      </span>
                                    )
                                  }
                                  return (
                                    <button
                                      key={m.field}
                                      onClick={() => { setEditingChip({ company: r.name, field: m.field }); setChipDraft('') }}
                                      title={`Click to add: ${m.label}`}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                                    >
                                      + {m.label}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
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
                            {isInsufficient ? (
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-semibold text-amber-700">Insufficient</span>
                                <span className="text-[10px] text-amber-700/70 tabular-nums">{r.score.sourceCount ?? 0} sources</span>
                              </div>
                            ) : (
                              <span className={cn('text-lg font-extrabold',
                                isDQ ? 'text-red-400' :
                                r.score.total >= 80 ? 'text-emerald-600' :
                                r.score.total >= 60 ? 'text-amber-500' : 'text-slate-400'
                              )}>
                                {isDQ ? '—' : r.score.total}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const row = validRows.find(v => v.name === r.name)
                                  if (row) {
                                    void clearCachedFor(row.website || row.name, product, icpTags)
                                  }
                                  void runAnalysis({ forceRows: [r.name] })
                                }}
                                title="Re-score this company (bypass 24h cache)"
                                className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-low transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <PipelineButton
                                company={r}
                                campaignName={campaignName}
                                product={product}
                              />
                            </div>
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

    </div>
  )
}
