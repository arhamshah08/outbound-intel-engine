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

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-outline'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-outline-variant rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold w-14 text-right">{score}/{max}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: CompanyResult['score']['status'] }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold',
      status === 'CALL NOW' ? 'bg-green-100 text-green-700' :
      status === 'SEQUENCE' ? 'bg-amber-100 text-amber-700' :
      status === 'DISQUALIFIED' ? 'bg-red-100 text-red-600' :
      'bg-gray-100 text-gray-500'
    )}>
      {status}
    </span>
  )
}

function ProgressBadge({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
      <Loader2 className="w-3 h-3 animate-spin" />
      {message}
    </span>
  )
}

function InputTable({ data }: { data: CompanyResult['inputData'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-outline-variant">
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">#</th>
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">Source</th>
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">Type</th>
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">Value</th>
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">Conf.</th>
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">Source Link</th>
            <th className="text-left py-2 px-3 font-semibold text-on-surface-variant">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className={cn('border-b border-outline-variant/50', row.gap && 'bg-red-50')}>
              <td className="py-2 px-3 text-on-surface-variant">{row.id}</td>
              <td className="py-2 px-3 font-medium">{row.source}</td>
              <td className="py-2 px-3">
                <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium',
                  row.type === 'Pain Point' ? 'bg-red-100 text-red-700' :
                  row.type === 'Buying Signal' ? 'bg-green-100 text-green-700' :
                  row.type === 'Contact' || row.type === 'Contact + Email' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {row.type}
                </span>
              </td>
              <td className="py-2 px-3 max-w-xs">{row.value}</td>
              <td className="py-2 px-3">
                <span className={cn('font-medium',
                  row.confidence === 'High' ? 'text-green-600' :
                  row.confidence === 'Medium' ? 'text-amber-600' : 'text-red-500'
                )}>
                  {row.confidence}
                </span>
              </td>
              <td className="py-2 px-3">
                {row.url ? (
                  <a href={row.url.startsWith('http') ? row.url : `https://${row.url}`} target="_blank" rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1">
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
  )
}

function CallBriefPanel({ company, product }: { company: CompanyResult; product: string }) {
  const [brief, setBrief] = useState(company.callBrief)
  const [loading, setLoading] = useState(false)
  const [showInputTable, setShowInputTable] = useState(false)

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
  const isDisqualified = company.score.status === 'DISQUALIFIED'

  return (
    <div className="animate-slide-in bg-white border border-outline-variant rounded-2xl shadow-card overflow-hidden">
      <div className="bg-on-surface px-6 py-4 flex items-start justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">{company.name} — {isDisqualified ? 'Disqualification Summary' : 'Call Brief'}</h2>
          <p className="text-white/60 text-sm mt-0.5">
            {company.domain} · {company.industry} · {company.headcount} employees
          </p>
        </div>
        <div className="text-right">
          <div className={cn('text-2xl font-black',
            company.score.total >= 80 ? 'text-green-400' :
            company.score.total >= 60 ? 'text-amber-400' :
            isDisqualified ? 'text-red-400' : 'text-gray-400'
          )}>
            {isDisqualified ? 'DQ' : `${company.score.total}/100`}
          </div>
          <StatusBadge status={company.score.status} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {isDisqualified && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-1">Disqualified — Hospital / Health System</p>
            <p className="text-sm text-red-800">{company.score.dimensions[0]?.evidence ?? 'This account type has 12-18 month procurement cycles and committee buying structures that fall outside our ICP.'}</p>
          </div>
        )}

        {contact && !isDisqualified && (
          <div className="flex items-center gap-4 p-4 bg-surface-low rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {contact.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{contact.name}</p>
              <p className="text-sm text-on-surface-variant">{contact.title}</p>
            </div>
            <div className="flex gap-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}
              {contact.linkedin && (
                <a href={contact.linkedin} target="_blank" rel="noreferrer" className="px-3 py-1.5 border border-outline-variant text-xs rounded-lg font-medium flex items-center gap-1">
                  LinkedIn <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-on-surface-variant">Score Breakdown</h3>
          <div className="space-y-2.5">
            {company.score.dimensions.map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant">{d.name}</span>
                  <span className="font-medium">max {d.maxScore} pts · {d.confidence}</span>
                </div>
                <ScoreBar score={d.score} max={d.maxScore} />
                <p className="text-xs text-on-surface-variant mt-0.5">{d.evidence}</p>
                {d.researchUrl && (
                  <a href={d.researchUrl.startsWith('http') ? d.researchUrl : `https://${d.researchUrl}`}
                    target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5">
                    Research further <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pain Points */}
        {!isDisqualified && (
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-on-surface-variant">Sourced Pain Points</h3>
            <div className="space-y-2">
              {company.inputData.filter(d => d.type === 'Pain Point').map((p, i) => (
                <div key={i} className="flex gap-3 p-3 bg-red-50 rounded-lg">
                  <span className="text-red-500 font-bold text-sm">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm">{p.value}</p>
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
          </div>
        )}

        {/* Brief */}
        {!isDisqualified && (
          !brief ? (
            <button onClick={loadBrief} disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Call Brief...</> : <><Phone className="w-4 h-4" /> Generate Full Call Brief</>}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-1">Open With</p>
                <p className="text-sm font-medium">&ldquo;{brief.openWith}&rdquo;</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">Email First Line</p>
                <p className="text-sm font-medium">&ldquo;{brief.personalizedFirstLine}&rdquo;</p>
                <p className="text-xs text-blue-600 mt-1">Subject: {brief.emailSubjectLine}</p>
              </div>

              {brief.referenceOnCall?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">Reference On The Call</p>
                  <div className="space-y-1.5">
                    {brief.referenceOnCall.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-bold">→</span>
                        <span className="flex-1">{r.point}</span>
                        {r.url && (
                          <a href={r.url.startsWith('http') ? r.url : `https://${r.url}`} target="_blank" rel="noreferrer" className="text-primary shrink-0">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.stillMissing?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">Research Before Calling</p>
                  {brief.stillMissing.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-amber-800">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{m.item} → <span className="font-medium">{m.where}</span></span>
                    </div>
                  ))}
                </div>
              )}

              {brief.researchLinks?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">Research Links</p>
                  <div className="flex flex-wrap gap-2">
                    {brief.researchLinks.filter(Boolean).map((link, i) => (
                      <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer"
                        className="px-3 py-1 bg-surface-container text-xs rounded-full text-primary hover:bg-surface-low flex items-center gap-1">
                        {link.replace(/^https?:\/\//, '').split('/')[0]} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* Input Table (expandable) */}
        <div>
          <button onClick={() => setShowInputTable(s => !s)}
            className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            {showInputTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Raw Input Table ({company.inputData.length} data points)
          </button>
          {showInputTable && (
            <div className="mt-3 border border-outline-variant rounded-xl overflow-hidden">
              <InputTable data={company.inputData} />
            </div>
          )}
        </div>
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null)
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
      if (parts.length >= 2) {
        newRows.push({ name: parts[0].trim(), website: parts[1].trim() })
      } else if (parts[0].trim()) {
        newRows.push({ name: parts[0].trim(), website: '' })
      }
    }
    if (newRows.length) {
      setRows(newRows)
      setPasteText('')
      setShowPaste(false)
    }
  }

  async function runAnalysis() {
    if (!validRows.length) return
    setRunStatus('running')
    setResults([])
    setProgress({})
    setSelected(new Set())
    setActiveBriefId(null)

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

  function selectTop3() {
    const top = results.filter(r => r.score.status !== 'DISQUALIFIED').slice(0, 3).map(r => r.id)
    setSelected(new Set(top))
  }

  function selectTop30() {
    const qualified = results.filter(r => r.score.status !== 'DISQUALIFIED')
    const count = Math.ceil(qualified.length * 0.3)
    const top = qualified.slice(0, count).map(r => r.id)
    setSelected(new Set(top))
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const callNow = results.filter(r => r.score.status === 'CALL NOW').length
  const qualified = results.filter(r => r.score.status !== 'DISQUALIFIED')
  const avg = qualified.length ? (qualified.reduce((s, r) => s + r.score.total, 0) / qualified.length).toFixed(0) : '—'
  const activeCompany = results.find(r => r.id === activeBriefId)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-on-surface border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Outbound Intelligence Engine</h1>
            <p className="text-white/40 text-xs">Score · Enrich · Personalize</p>
          </div>
          {campaignName && (
            <span className="ml-auto text-white/60 text-sm">{campaignName}</span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign info */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <h2 className="font-bold text-on-surface">Campaign Setup</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Campaign Name</label>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="Q3 Healthcare Outreach"
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">What You&apos;re Selling</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={4}
                placeholder="Describe your product and who it's for — e.g. 'AI-powered referral and scheduling automation for PE-backed specialty groups. Reduces fax volume and no-shows by 40%.'"
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary resize-none" />
            </div>

            <div className="p-3 bg-surface-low rounded-lg">
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Scoring: </span>
                ICP Fit /30 · Workflow Pain /20 · Scale /15 · Buying Committee /15 · Growth /10 · Messaging /10
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                <span className="text-green-600 font-semibold">≥80 CALL NOW</span> · <span className="text-amber-600 font-semibold">60–79 SEQUENCE</span> · <span className="text-gray-500 font-semibold">&lt;60 DEPRIORITIZE</span> · <span className="text-red-600 font-semibold">Hospitals = DQ</span>
              </p>
            </div>
          </div>

          {/* Company table input */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-on-surface">Companies</h2>
              <span className="text-xs text-on-surface-variant">{validRows.length} {validRows.length === 1 ? 'company' : 'companies'}</span>
            </div>

            {/* Table */}
            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-low border-b border-outline-variant">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Company Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Website</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant/50 last:border-0">
                      <td className="px-2 py-1.5">
                        <input
                          value={row.name}
                          onChange={e => updateRow(i, 'name', e.target.value)}
                          placeholder="Company name"
                          className="w-full px-1.5 py-1 text-sm rounded border-0 focus:outline-none focus:bg-primary/5 bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={row.website}
                          onChange={e => updateRow(i, 'website', e.target.value)}
                          placeholder="domain.com"
                          className="w-full px-1.5 py-1 text-sm rounded border-0 focus:outline-none focus:bg-primary/5 bg-transparent font-mono text-xs"
                        />
                      </td>
                      <td className="pr-2">
                        <button onClick={() => removeRow(i)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row + paste */}
            <div className="flex items-center gap-2">
              <button onClick={addRow}
                className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-low">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
              <button onClick={() => setShowPaste(s => !s)}
                className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-low">
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste from Sheets
              </button>
            </div>

            {/* Paste zone */}
            {showPaste && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant">Copy two columns from Google Sheets (Company Name | Website) and paste below:</p>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  rows={4}
                  placeholder={"Elevate ENT Partners\televateent.com\nGrowth Orthopedics\tgrowthorthopedics.com"}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-xs font-mono focus:outline-none focus:border-primary resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handlePasteImport}
                    disabled={!pasteText.trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
                    Import Rows
                  </button>
                  <button onClick={() => { setShowPaste(false); setPasteText('') }}
                    className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-low transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button onClick={runAnalysis} disabled={!validRows.length || runStatus === 'running'}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {runStatus === 'running'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing {validRows.length} companies...</>
                : <><Zap className="w-4 h-4" /> Analyze {validRows.length} {validRows.length === 1 ? 'Company' : 'Companies'} →</>
              }
            </button>
          </div>
        </div>

        {/* Progress */}
        {Object.keys(progress).length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">Processing</p>
            {Object.entries(progress).map(([company, message]) => (
              <div key={company} className="flex items-center gap-3">
                <span className="font-medium text-sm w-48 truncate">{company}</span>
                <ProgressBadge message={message} />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-sm text-on-surface-variant"><strong className="text-on-surface">{results.length}</strong> companies</span>
                <span className="text-sm text-on-surface-variant">Avg score <strong className="text-on-surface">{avg}/100</strong></span>
                <span className="text-sm text-green-600 font-semibold">{callNow} call-ready</span>
                {results.filter(r => r.score.status === 'DISQUALIFIED').length > 0 && (
                  <span className="text-sm text-red-500 font-semibold">
                    {results.filter(r => r.score.status === 'DISQUALIFIED').length} DQ&apos;d
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={selectTop3} className="px-3 py-1.5 text-xs font-semibold bg-surface-container rounded-lg hover:bg-surface-low transition-colors">
                  Select Top 3
                </button>
                <button onClick={selectTop30} className="px-3 py-1.5 text-xs font-semibold bg-surface-container rounded-lg hover:bg-surface-low transition-colors">
                  Select Top 30%
                </button>
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-xs font-semibold text-error border border-error/30 rounded-lg hover:bg-red-50 transition-colors">
                    Clear ({selected.size})
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-outline-variant">
                  <tr>
                    <th className="w-10 py-3 px-4"></th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant w-52">Score /100</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Top Signal</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">Contact</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const topSignal = r.inputData.find(d => d.type === 'Buying Signal')?.value ?? r.inputData.find(d => d.type === 'Pain Point')?.value ?? '—'
                    const contact = r.contacts[0]
                    const isDQ = r.score.status === 'DISQUALIFIED'
                    return (
                      <tr key={r.id} className={cn('border-b border-outline-variant/50 transition-colors',
                        isDQ ? 'bg-red-50/40' :
                        selected.has(r.id) ? 'bg-primary/5' : 'hover:bg-surface-low',
                        activeBriefId === r.id && 'bg-primary/10'
                      )}>
                        <td className="py-3 px-4">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
                            disabled={isDQ}
                            className="w-4 h-4 accent-primary disabled:opacity-30" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm">{r.name}</div>
                          <div className="text-xs text-on-surface-variant">{r.domain} · {r.industry}</div>
                        </td>
                        <td className="py-3 px-4">
                          {isDQ ? (
                            <span className="text-xs text-red-500 font-semibold">Disqualified</span>
                          ) : (
                            <ScoreBar score={r.score.total} max={100} />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.score.status} />
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <span className="text-xs text-on-surface-variant line-clamp-2">{topSignal.slice(0, 100)}</span>
                        </td>
                        <td className="py-3 px-4">
                          {contact ? (
                            <div>
                              <div className="text-xs font-medium">{contact.name}</div>
                              <div className="text-xs text-on-surface-variant">{contact.title}</div>
                            </div>
                          ) : <span className="text-xs text-on-surface-variant">Not found</span>}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => setActiveBriefId(activeBriefId === r.id ? null : r.id)}
                            className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                              activeBriefId === r.id
                                ? 'bg-on-surface text-white'
                                : isDQ
                                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                : r.score.status === 'CALL NOW'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-low'
                            )}>
                            {activeBriefId === r.id ? 'Close' : isDQ ? 'Why DQ?' : r.score.status === 'CALL NOW' ? 'Call Brief' : 'Details'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {activeCompany && (
              <CallBriefPanel key={activeCompany.id} company={activeCompany} product={product} />
            )}

            {selected.size > 0 && !activeBriefId && (
              <div className="bg-primary rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{selected.size} {selected.size === 1 ? 'company' : 'companies'} selected</p>
                  <p className="text-white/60 text-sm">Click &quot;Call Brief&quot; on any row to open the full study</p>
                </div>
                <div className="flex gap-2">
                  {Array.from(selected).map(id => {
                    const r = results.find(x => x.id === id)
                    return r ? (
                      <button key={id} onClick={() => setActiveBriefId(id)}
                        className="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors">
                        {r.name}
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-outline-variant mt-16 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-on-surface-variant">
          <span>Sources: Exa · Apollo · Brave · Clay · Firecrawl · Gemini · OpenAI</span>
          <span>Outbound Intelligence Engine · 2026</span>
        </div>
      </footer>
    </div>
  )
}
