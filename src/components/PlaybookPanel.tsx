'use client'
import { useState, useEffect, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, Loader2, Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Prospect, Playbook, FAQ, PlaybookOpener, DecisionBranch, ReinforcementLog } from '@/lib/types'
import type { Contact } from '@/lib/types'

type Tab = 'openers' | 'decision' | 'faqs'
const FAQ_CATS = ['all','product','integration','pricing','timeline','competition','objection'] as const
const CAT_LABEL: Record<string, string> = {
  all: 'All', product: 'Product', integration: 'Integration',
  pricing: 'Pricing', timeline: 'Timeline', competition: 'Competition', objection: 'Objections',
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:bg-surface-low transition-colors">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function ReinforcementBtns({
  itemType, itemRefId, itemText, contactName, contactTitle, prospectId, initialWorked,
  onFeedback,
}: {
  itemType: ReinforcementLog['item_type']
  itemRefId?: string
  itemText: string
  contactName: string
  contactTitle: string
  prospectId: string
  initialWorked?: boolean | null
  onFeedback?: (outcome: 'yes' | 'no') => void
}) {
  const [worked, setWorked] = useState<boolean | null>(initialWorked ?? null)
  const [saving, setSaving] = useState(false)

  async function log(outcome: 'yes' | 'no') {
    if (saving) return
    setSaving(true)
    const newWorked = outcome === 'yes'
    setWorked(newWorked)
    await supabase.from('reinforcement_log').insert({
      prospect_id:  prospectId,
      contact_name: contactName,
      contact_title: contactTitle,
      item_type:    itemType,
      item_ref_id:  itemRefId ?? null,
      item_text:    itemText.slice(0, 500),
      outcome,
    })
    if (itemRefId && itemType === 'faq') {
      await supabase.from('faqs').update({ worked: newWorked }).eq('id', itemRefId)
    }
    setSaving(false)
    onFeedback?.(outcome)
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => log('yes')} disabled={saving}
        className={cn('p-1.5 rounded-lg transition-all',
          worked === true  ? 'bg-emerald-100 text-emerald-600' : 'text-on-surface-variant hover:bg-emerald-50 hover:text-emerald-600'
        )}>
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => log('no')} disabled={saving}
        className={cn('p-1.5 rounded-lg transition-all',
          worked === false ? 'bg-red-100 text-red-500' : 'text-on-surface-variant hover:bg-red-50 hover:text-red-500'
        )}>
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function OpenerCard({ opener, contact, prospectId }: { opener: PlaybookOpener; contact: Contact; prospectId: string }) {
  return (
    <div className="p-4 bg-surface-low border border-outline-variant rounded-xl space-y-2">
      <p className="text-xs font-bold text-primary uppercase tracking-wide">{opener.context}</p>
      <p className="text-sm leading-relaxed text-on-surface">{opener.text}</p>
      <div className="flex items-center justify-between pt-1">
        <CopyBtn text={opener.text} />
        <ReinforcementBtns
          itemType="opener" itemRefId={opener.id}
          itemText={opener.text}
          contactName={contact.name} contactTitle={contact.title ?? ''}
          prospectId={prospectId}
        />
      </div>
    </div>
  )
}

function BranchCard({
  branch, type, contact, prospectId,
}: { branch: DecisionBranch; type: 'if_yes' | 'if_no'; contact: Contact; prospectId: string }) {
  return (
    <div className={cn('p-4 border rounded-xl space-y-2',
      type === 'if_yes' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
    )}>
      <div className="flex items-start gap-2">
        <span className={cn('shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5',
          type === 'if_yes' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
        )}>
          {type === 'if_yes' ? 'IF YES' : 'IF NO'}
        </span>
        <p className="text-xs font-semibold text-on-surface">&ldquo;{branch.trigger}&rdquo;</p>
      </div>
      <p className="text-sm leading-relaxed text-on-surface pl-0">{branch.response}</p>
      <div className="flex items-center justify-between pt-1">
        <CopyBtn text={branch.response} />
        <ReinforcementBtns
          itemType={type === 'if_yes' ? 'if_yes' : 'if_no'} itemRefId={branch.id}
          itemText={branch.response}
          contactName={contact.name} contactTitle={contact.title ?? ''}
          prospectId={prospectId}
        />
      </div>
    </div>
  )
}

function FAQCard({ faq, contact, prospectId }: { faq: FAQ; contact: Contact; prospectId: string }) {
  const [open, setOpen] = useState(false)
  const [worked, setWorked] = useState<boolean | null>(faq.worked)

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-colors',
      worked === true  ? 'border-emerald-200 bg-emerald-50/30' :
      worked === false ? 'border-red-200 bg-red-50/20' :
                         'border-outline-variant bg-white'
    )}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-low/50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface leading-snug">{faq.question}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {worked === true  && <span className="text-xs text-emerald-600 font-semibold">✓ Worked</span>}
          {worked === false && <span className="text-xs text-red-500 font-semibold">✗ Didn&apos;t</span>}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-on-surface-variant" /> : <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/50">
          <p className="text-sm text-on-surface leading-relaxed pt-3">{faq.answer}</p>
          <div className="flex items-center justify-between">
            <CopyBtn text={faq.answer} />
            <ReinforcementBtns
              itemType="faq" itemRefId={faq.id}
              itemText={faq.question}
              contactName={contact.name} contactTitle={contact.title ?? ''}
              prospectId={prospectId}
              initialWorked={faq.worked}
              onFeedback={o => setWorked(o === 'yes')}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlaybookPanel({
  prospect, contact,
}: {
  prospect: Prospect
  contact: Contact
}) {
  const [tab,       setTab]       = useState<Tab>('openers')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [playbook,  setPlaybook]  = useState<Playbook | null>(null)
  const [faqs,      setFaqs]      = useState<FAQ[]>([])
  const [loading,   setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [rlStats,   setRlStats]   = useState({ yes: 0, no: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: pb }, { data: faqData }, { data: rl }] = await Promise.all([
      supabase.from('playbooks').select('*').eq('prospect_id', prospect.id).eq('contact_name', contact.name).maybeSingle(),
      supabase.from('faqs').select('*').eq('prospect_id', prospect.id).eq('contact_name', contact.name).order('category'),
      supabase.from('reinforcement_log').select('outcome').eq('prospect_id', prospect.id).eq('contact_name', contact.name),
    ])
    setPlaybook(pb ?? null)
    setFaqs(faqData ?? [])
    const logs = rl ?? []
    setRlStats({ yes: logs.filter(l => l.outcome === 'yes').length, no: logs.filter(l => l.outcome === 'no').length })
    setLoading(false)
  }, [prospect.id, contact.name])

  useEffect(() => { load() }, [load])

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, prospect }),
      })
      const { ok } = await res.json()
      if (ok) await load()
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-on-surface-variant gap-2 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading playbook…
    </div>
  )

  if (!playbook) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-on-surface-variant">No playbook yet for <strong>{contact.name}</strong></p>
      <button onClick={generate} disabled={generating}
        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60 transition-colors flex items-center gap-2">
        {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating 50 questions…</> : '⚡ Generate Playbook'}
      </button>
    </div>
  )

  const total = rlStats.yes + rlStats.no
  const filteredFaqs = catFilter === 'all' ? faqs : faqs.filter(f => f.category === catFilter)

  return (
    <div className="space-y-4">
      {/* Reinforcement summary */}
      {total > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-xs">
          <span className="font-semibold text-on-surface-variant">Reinforcement:</span>
          <span className="text-emerald-600 font-bold">{rlStats.yes} worked</span>
          <span className="text-red-500 font-bold">{rlStats.no} didn&apos;t</span>
          <span className="text-on-surface-variant">({total} signals logged)</span>
          <div className="flex-1 h-1.5 bg-outline-variant rounded-full overflow-hidden ml-1">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((rlStats.yes / total) * 100)}%` }} />
          </div>
          <span className="font-semibold">{Math.round((rlStats.yes / total) * 100)}%</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-outline-variant pb-0">
        {([['openers','Openers (5)'],['decision','Decision Tree'],['faqs',`FAQs (${faqs.length})`]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('px-3 py-2 text-xs font-semibold rounded-t-lg transition-all',
              tab === id ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-low'
            )}>
            {label}
          </button>
        ))}
        <button onClick={generate} disabled={generating}
          className="ml-auto text-xs font-semibold text-primary hover:underline disabled:opacity-50 flex items-center gap-1">
          {generating ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating…</> : '↻ Regenerate'}
        </button>
      </div>

      {/* Openers */}
      {tab === 'openers' && (
        <div className="space-y-3">
          {playbook.openers.map(o => <OpenerCard key={o.id} opener={o} contact={contact} prospectId={prospect.id} />)}
        </div>
      )}

      {/* Decision tree */}
      {tab === 'decision' && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">If they say YES →</p>
          {playbook.if_yes_branches.map(b => <BranchCard key={b.id} branch={b} type="if_yes" contact={contact} prospectId={prospect.id} />)}
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mt-4">If they say NO →</p>
          {playbook.if_no_branches.map(b => <BranchCard key={b.id} branch={b} type="if_no" contact={contact} prospectId={prospect.id} />)}
        </div>
      )}

      {/* FAQs */}
      {tab === 'faqs' && (
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {FAQ_CATS.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={cn('px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                  catFilter === c ? 'bg-primary text-white' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
                )}>
                {CAT_LABEL[c]}
                {c !== 'all' && <span className="ml-1 opacity-60">({faqs.filter(f => f.category === c).length})</span>}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredFaqs.map(f => <FAQCard key={f.id} faq={f} contact={contact} prospectId={prospect.id} />)}
          </div>
        </div>
      )}
    </div>
  )
}
