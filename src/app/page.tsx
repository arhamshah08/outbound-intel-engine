'use client'
import { useState, useRef } from 'react'
import { Zap, ChevronDown, ChevronUp, ExternalLink, AlertCircle, Phone, Mail, Loader2, Plus, X, ClipboardPaste } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompanyResult } from '@/lib/types'

const DEFAULT_ROWS = [
  { name: 'Elevate ENT Partners', website: 'elevateent.com' },
  { name: 'The US Oncology Network', website: 'usoncology.com' },
  { name: 'Growth Orthopedics', website: 'growthorthopedics.com' },
  { name: 'Baylor Scott & White Health', website: 'bswhealth.com' },
  { name: 'Sutter Health', website: 'sutterhealth.org' },
]

type CompanyRow = { name: string; website: string }
type Filter = 'ALL' | 'HIGH' | 'MED' | 'LOW' | 'DQ'

function priority(status: CompanyResult['score']['status']): Filter {
  if (status === 'CALL NOW') return 'HIGH'
  if (status === 'SEQUENCE') return 'MED'
  if (status === 'DISQUALIFIED') return 'DQ'
  return 'LOW'
}

function PriorityBadge({ status }: { status: CompanyResult['score']['status'] }) {
  const p = priority(status)
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
      p === 'HIGH' ? 'bg-green-500 text-white' :
      p === 'MED' ? 'bg-amber-400 text-white' :
      p === 'DQ' ? 'bg-red-100 text-red-600' :
      'bg-gray-100 text-gray-500'
    )}>
      {p}
    </span>
  )
}

function ScoreCell({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0
  return (
    <div className={cn('text-center text-xs font-bold py-0.5 px-1 rounded',
      score === 0 ? 'bg-red-50 text-red-400' :
      pct >= 0.8 ? 'bg-green-50 text-green-700' :
      pct >= 0.5 ? 'bg-amber-50 text-amber-700' :
      'bg-gray-50 text-gray-500'
    )}>
      {score}
    </div>
  )
}

function BriefPanel({ company, product }: { company: CompanyResult; product: string }) {
  const [brief, setBrief] = useState(company.callBrief)
  const [loading, setLoading] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const isDQ = company.score.status === 'DISQUALIFIED'

  async function loadBrief() {
    setLoading(true)
    const res = await fetch('/api/enrich', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, product }),
    })
    const { brief: b } = await res.json()
    setBrief(b)
    company.callBrief = b
    setLoading(false)
  }

  const contact = company.contacts[0]
  const painPoints = company.inputData.filter(d => d.type === 'Pain Point')
  const phone = contact?.phone || company.mainPhone

  return (
    <div className="bg-white border border-outline-variant rounded-2xl shadow-card overflow-hidden">
      {/* Compact header strip */}
      <div className={cn('px-6 py-3 flex items-center justify-between',
        isDQ ? 'bg-red-50 border-b border-red-100' : 'bg-surface-low border-b border-outline-variant'
      )}>
        <div className="flex items-center gap-3">
          <PriorityBadge status={company.score.status} />
          <div>
            <span className="font-bold text-sm">{company.name}</span>
            <span className="text-on-surface-variant text-xs ml-2">{company.domain} · {company.industry}</span>
          </div>
        </div>
        <div className={cn('text-xl font-black',
          company.score.total >= 80 ? 'text-green-600' :
          company.score.total >= 60 ? 'text-amber-500' :
          isDQ ? 'text-red-500' : 'text-gray-400'
        )}>
          {isDQ ? 'DQ' : `${company.score.total}/100`}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Contact + Phone + Pain Points */}
        <div className="space-y-4">
          {/* Contact */}
          {contact && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Best Contact</p>
              <div className="flex items-start gap-3 p-3 bg-surface-low rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {contact.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{contact.name}</p>
                  <p className="text-xs text-on-surface-variant">{contact.title}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {phone && (
                      <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md hover:bg-green-100">
                        <Phone className="w-3 h-3" /> {phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100">
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    )}
                    {contact.linkedin && (
                      <a href={contact.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md hover:bg-surface-low">
                        LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {!phone && (
                <p className="text-xs text-on-surface-variant px-1">
                  No phone found · Try <a href={`https://hunter.io/${company.domain}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">hunter.io/{company.domain}</a> or <a href="https://apollo.io" target="_blank" rel="noreferrer" className="text-primary hover:underline">apollo.io</a>
                </p>
              )}
            </div>
          )}

          {/* Pain Points */}
          {!isDQ && painPoints.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Pain Triggers</p>
              {painPoints.slice(0, 3).map((p, i) => (
                <div key={i} className="flex gap-2 p-3 bg-red-50 rounded-lg">
                  <span className="text-red-400 font-bold text-xs shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1">
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

          {isDQ && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-1">Why Disqualified</p>
              <p className="text-sm text-red-800">{company.score.dimensions[0]?.evidence ?? 'Hospital or health system — 12-18 month procurement cycles outside our ICP.'}</p>
            </div>
          )}
        </div>

        {/* Right: Score breakdown + Call Brief */}
        <div className="space-y-4">
          {/* Score dimensions */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Score Breakdown</p>
            {company.score.dimensions.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="text-xs text-on-surface-variant w-36 shrink-0">{d.name}</div>
                <div className="flex-1 h-1.5 bg-outline-variant rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full',
                    d.score === 0 ? 'bg-red-300' :
                    d.score / d.maxScore >= 0.8 ? 'bg-green-500' :
                    d.score / d.maxScore >= 0.5 ? 'bg-amber-400' : 'bg-gray-300'
                  )} style={{ width: `${Math.round((d.score / d.maxScore) * 100)}%` }} />
                </div>
                <div className="text-xs font-bold w-12 text-right shrink-0">{d.score}/{d.maxScore}</div>
              </div>
            ))}
          </div>

          {/* Call brief / CTA */}
          {!isDQ && (
            !brief ? (
              <button onClick={loadBrief} disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Phone className="w-4 h-4" /> Generate Call Script</>}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-1">Open With</p>
                  <p className="text-sm">&ldquo;{brief.openWith}&rdquo;</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">Email Subject / First Line</p>
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">{brief.emailSubjectLine}</p>
                  <p className="text-sm">&ldquo;{brief.personalizedFirstLine}&rdquo;</p>
                </div>
                {brief.stillMissing?.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1.5">Research Before Calling</p>
                    {brief.stillMissing.map((m, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{m.item} → <span className="font-medium">{m.where}</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Raw data toggle */}
      <div className="px-6 pb-4">
        <button onClick={() => setShowRawData(s => !s)}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
          {showRawData ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Raw data points ({company.inputData.length})
        </button>
        {showRawData && (
          <div className="mt-3 overflow-x-auto border border-outline-variant rounded-xl">
            <table className="w-full text-xs">
              <thead className="border-b border-outline-variant">
                <tr>
                  {['#', 'Source', 'Type', 'Value', 'Conf.', 'Link', 'Action'].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {company.inputData.map((row) => (
                  <tr key={row.id} className={cn('border-b border-outline-variant/50', row.gap && 'bg-red-50')}>
                    <td className="py-2 px-3 text-on-surface-variant">{row.id}</td>
                    <td className="py-2 px-3 font-medium">{row.source}</td>
                    <td className="py-2 px-3">
                      <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium',
                        row.type === 'Pain Point' ? 'bg-red-100 text-red-700' :
                        row.type === 'Buying Signal' ? 'bg-green-100 text-green-700' :
                        row.type === 'Contact' || row.type === 'Contact + Email' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      )}>{row.type}</span>
                    </td>
                    <td className="py-2 px-3 max-w-xs">{row.value}</td>
                    <td className="py-2 px-3">
                      <span className={cn('font-medium',
                        row.confidence === 'High' ? 'text-green-600' :
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
                    <td className="py-2 px-3 text-on-surface-variant">{row.loopAction ?? '—'}</td>
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

export default function Home() {
  const [campaignName, setCampaignName] = useState('')
  const [product, setProduct] = useState('')
  const [rows, setRows] = useState<CompanyRow[]>(DEFAULT_ROWS)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [results, setResults] = useState<CompanyResult[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const resultsRef = useRef<HTMLDivElement>(null)

  const validRows = rows.filter(r => r.name.trim())

  function updateRow(i: number, field: 'name' | 'website', value: string) {
    setRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r))
  }

  function removeRow(i: number) {
    setRows(prev => prev.filter((_, j) => j !== i))
  }

  function addRow() {
    setRows(prev => [...prev, { name: '', website: '' }])
  }

  function handlePasteImport() {
    const lines = pasteText.trim().split('\n').filter(Boolean)
    const newRows: CompanyRow[] = []
    for (const line of lines) {
      const parts = line.split('\t')
      newRows.push({ name: parts[0]?.trim() ?? '', website: parts[1]?.trim() ?? '' })
    }
    const valid = newRows.filter(r => r.name)
    if (valid.length) { setRows(valid); setPasteText(''); setShowPaste(false) }
  }

  async function runAnalysis() {
    if (!validRows.length) return
    setRunStatus('running')
    setResults([])
    setProgress({})
    setActiveBriefId(null)
    setFilter('ALL')

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
            setProgress(p => ({ ...p, [event.company]: event.message }))
          } else if (event.type === 'result') {
            setResults(r => [...r, event.data].sort((a, b) => b.score.total - a.score.total))
            setProgress(p => { const n = { ...p }; delete n[event.company]; return n })
          } else if (event.type === 'done') {
            setRunStatus('done')
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
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
    MED: results.filter(r => r.score.status === 'SEQUENCE').length,
    LOW: results.filter(r => r.score.status === 'DEPRIORITIZE').length,
    DQ: results.filter(r => r.score.status === 'DISQUALIFIED').length,
  }
  const filtered = filter === 'ALL' ? results
    : filter === 'HIGH' ? results.filter(r => r.score.status === 'CALL NOW')
    : filter === 'MED' ? results.filter(r => r.score.status === 'SEQUENCE')
    : filter === 'LOW' ? results.filter(r => r.score.status === 'DEPRIORITIZE')
    : results.filter(r => r.score.status === 'DISQUALIFIED')

  // Get the 6 dimension names from the first result (they're always the same order)
  const dimDefs = results[0]?.score?.dimensions ?? []

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-on-surface border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Outbound Intelligence Engine</h1>
            <p className="text-white/40 text-xs">Score · Enrich · Personalize</p>
          </div>
          {campaignName && <span className="ml-auto text-white/60 text-sm">{campaignName}</span>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Setup — compact 2-col */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign */}
          <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
            <h2 className="font-bold text-sm text-on-surface uppercase tracking-wide">Campaign Setup</h2>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Campaign Name</label>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="Q3 Healthcare Outreach"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">What You&apos;re Selling</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3}
                placeholder="AI-powered referral and scheduling automation for PE-backed specialty groups..."
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div className="text-xs text-on-surface-variant bg-surface-low rounded-lg px-3 py-2">
              <span className="font-semibold text-green-600">≥80 HIGH</span> · <span className="font-semibold text-amber-500">60–79 MED</span> · <span className="font-semibold text-gray-400">&lt;60 LOW</span> · <span className="font-semibold text-red-500">Hospital = DQ</span>
            </div>
          </div>

          {/* Companies */}
          <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-on-surface uppercase tracking-wide">Companies</h2>
              <span className="text-xs text-on-surface-variant">{validRows.length} companies</span>
            </div>

            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-low border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold text-on-surface-variant">Company Name</th>
                    <th className="text-left px-3 py-1.5 text-xs font-semibold text-on-surface-variant">Website</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant/40 last:border-0">
                      <td className="px-2 py-1">
                        <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)}
                          placeholder="Company name"
                          className="w-full px-1.5 py-1 text-sm focus:outline-none focus:bg-primary/5 rounded bg-transparent" />
                      </td>
                      <td className="px-2 py-1">
                        <input value={row.website} onChange={e => updateRow(i, 'website', e.target.value)}
                          placeholder="domain.com"
                          className="w-full px-1.5 py-1 text-xs font-mono focus:outline-none focus:bg-primary/5 rounded bg-transparent" />
                      </td>
                      <td className="pr-2">
                        <button onClick={() => removeRow(i)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={addRow}
                className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-low transition-colors">
                <Plus className="w-3 h-3" /> Add Row
              </button>
              <button onClick={() => setShowPaste(s => !s)}
                className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-low transition-colors">
                <ClipboardPaste className="w-3 h-3" /> Paste from Sheets
              </button>
            </div>

            {showPaste && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant">Copy 2 columns (Name · Website) from Google Sheets and paste:</p>
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={3}
                  placeholder={"Elevate ENT Partners\televateent.com"}
                  className="w-full px-2 py-1.5 rounded-lg border border-outline-variant text-xs font-mono focus:outline-none focus:border-primary resize-none" />
                <div className="flex gap-2">
                  <button onClick={handlePasteImport} disabled={!pasteText.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">
                    Import
                  </button>
                  <button onClick={() => { setShowPaste(false); setPasteText('') }}
                    className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-low">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button onClick={runAnalysis} disabled={!validRows.length || runStatus === 'running'}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {runStatus === 'running'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing {validRows.length} companies...</>
                : <><Zap className="w-4 h-4" /> Run Analysis →</>}
            </button>
          </div>
        </div>

        {/* Progress */}
        {Object.keys(progress).length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">Processing</p>
            <div className="space-y-1.5">
              {Object.entries(progress).map(([company, message]) => (
                <div key={company} className="flex items-center gap-3">
                  <span className="font-medium text-sm w-48 truncate">{company}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Loader2 className="w-3 h-3 animate-spin" />{message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div ref={resultsRef} className="space-y-4">
            {/* Stats + filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-on-surface-variant">
                  <strong className="text-on-surface">{results.length}</strong> companies
                  {avg !== null && <> · avg <strong className="text-on-surface">{avg}/100</strong></>}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['ALL', 'HIGH', 'MED', 'LOW', 'DQ'] as Filter[]).map(f => (
                  <button key={f} onClick={() => { setFilter(f); setActiveBriefId(null) }}
                    className={cn('px-3 py-1.5 text-xs font-bold rounded-lg transition-colors',
                      filter === f
                        ? f === 'HIGH' ? 'bg-green-500 text-white'
                          : f === 'MED' ? 'bg-amber-400 text-white'
                          : f === 'DQ' ? 'bg-red-500 text-white'
                          : f === 'LOW' ? 'bg-gray-500 text-white'
                          : 'bg-on-surface text-white'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-low'
                    )}>
                    {f} {counts[f] > 0 && <span className="opacity-75 ml-0.5">({counts[f]})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Main results table — spreadsheet style */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-outline-variant">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant w-20">Priority</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Company</th>
                      <th className="py-3 px-2 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-16">
                        ICP<span className="text-on-surface-variant/50">/30</span>
                      </th>
                      <th className="py-3 px-2 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-16">
                        Pain<span className="text-on-surface-variant/50">/20</span>
                      </th>
                      <th className="py-3 px-2 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-16">
                        Scale<span className="text-on-surface-variant/50">/15</span>
                      </th>
                      <th className="py-3 px-2 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-16">
                        Cmte<span className="text-on-surface-variant/50">/15</span>
                      </th>
                      <th className="py-3 px-2 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-16">
                        Grwth<span className="text-on-surface-variant/50">/10</span>
                      </th>
                      <th className="py-3 px-2 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-16">
                        Msg<span className="text-on-surface-variant/50">/10</span>
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Pain Triggers</th>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant w-36">Phone</th>
                      <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant w-20">
                        Score
                      </th>
                      <th className="py-3 px-4 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const dims = r.score.dimensions
                      const painTriggers = r.inputData
                        .filter(d => d.type === 'Pain Point')
                        .slice(0, 2)
                        .map(d => d.value.slice(0, 55))
                      const phone = r.contacts[0]?.phone || r.mainPhone
                      const isDQ = r.score.status === 'DISQUALIFIED'

                      return (
                        <>
                          <tr key={r.id} className={cn('border-b border-outline-variant/50 transition-colors',
                            activeBriefId === r.id ? 'bg-primary/5' :
                            isDQ ? 'bg-red-50/30' : 'hover:bg-surface-low'
                          )}>
                            <td className="py-3 px-4">
                              <PriorityBadge status={r.score.status} />
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-sm">{r.name}</div>
                              <div className="text-xs text-on-surface-variant">{r.domain}</div>
                            </td>
                            {/* Score cells — in dimension order */}
                            {dims.map((d) => (
                              <td key={d.name} className="py-3 px-2">
                                <ScoreCell score={d.score} max={d.maxScore} />
                              </td>
                            ))}
                            {/* Pad missing dims */}
                            {Array.from({ length: Math.max(0, 6 - dims.length) }).map((_, i) => (
                              <td key={`pad-${i}`} className="py-3 px-2" />
                            ))}
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
                                <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline">
                                  <Phone className="w-3 h-3" /> {phone}
                                </a>
                              ) : (
                                <span className="text-xs text-on-surface-variant">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={cn('text-base font-black',
                                isDQ ? 'text-red-400' :
                                r.score.total >= 80 ? 'text-green-600' :
                                r.score.total >= 60 ? 'text-amber-500' : 'text-gray-400'
                              )}>
                                {isDQ ? '—' : r.score.total}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button onClick={() => setActiveBriefId(activeBriefId === r.id ? null : r.id)}
                                className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                                  activeBriefId === r.id ? 'bg-on-surface text-white' :
                                  isDQ ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                                  r.score.status === 'CALL NOW' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                  'bg-surface-container text-on-surface-variant hover:bg-surface-low'
                                )}>
                                {activeBriefId === r.id ? 'Close' : isDQ ? 'Why DQ?' : r.score.status === 'CALL NOW' ? 'Call Brief' : 'Details'}
                              </button>
                            </td>
                          </tr>
                          {/* Inline brief panel */}
                          {activeBriefId === r.id && (
                            <tr key={`brief-${r.id}`}>
                              <td colSpan={13} className="px-4 pb-4">
                                <BriefPanel company={r} product={product} />
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-outline-variant mt-12 py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-on-surface-variant">
          <span>Sources: Exa · Apollo · Brave · Gemini · OpenAI</span>
          <span>Outbound Intelligence Engine · 2026</span>
        </div>
      </footer>
    </div>
  )
}
