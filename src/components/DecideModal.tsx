'use client'
import { useState } from 'react'
import { X, Phone, Mail, Linkedin, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { CompanyResult } from '@/lib/types'

interface Props {
  company: CompanyResult
  campaignName: string
  product: string
  onClose: () => void
  onAdded: () => void
}

const CHANNELS = [
  { id: 'call',     label: 'Call',     Icon: Phone },
  { id: 'email',    label: 'Email',    Icon: Mail },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
]

export default function DecideModal({ company, campaignName, product, onClose, onAdded }: Props) {
  const [channels, setChannels] = useState<string[]>(['call'])
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [savingStatus, setSavingStatus] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const isDQ = company.score.status === 'DISQUALIFIED'

  function toggle(id: string) {
    setChannels(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id])
  }

  async function save(status: 'active' | 'passed') {
    setSaving(true)
    setSaveError(null)
    setSavingStatus(status === 'active' ? 'Saving to pipeline...' : 'Passing...')

    // Step 1: Insert prospect
    const { data: inserted, error } = await supabase.from('prospects').insert({
      company_name:      company.name,
      domain:            company.domain,
      industry:          company.industry,
      headcount:         company.headcount,
      funding:           company.funding,
      location:          company.location ?? '',
      description:       company.description,
      score:             company.score.total,
      score_status:      company.score.status,
      score_dimensions:  company.score.dimensions,
      approach:          status === 'active' ? channels : [],
      status,
      contacts:          company.contacts,
      pain_points:       company.inputData.filter(d => d.type === 'Pain Point'),
      notes,
      campaign_name:     campaignName,
    }).select('id').single()

    if (error) {
      setSaving(false)
      setSaveError(error.message)
      return
    }

    // Step 2: Auto-generate brief in background (only for pipeline, not pass)
    if (status === 'active' && inserted?.id) {
      setSavingStatus('Generating notes...')
      try {
        await fetch('/api/enrich', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company, product, prospectId: inserted.id }),
        })
      } catch {
        // Non-fatal — brief can be generated later from Pipeline
      }
    }

    setSaving(false)
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-outline-variant">
          <div>
            <h2 className="font-bold text-base leading-tight">{company.name}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{company.domain} · {company.industry}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={cn('text-xl font-extrabold',
              isDQ                       ? 'text-red-400' :
              company.score.total >= 80  ? 'text-emerald-600' :
              company.score.total >= 60  ? 'text-amber-500' : 'text-slate-400'
            )}>
              {isDQ ? 'DQ' : `${company.score.total}/100`}
            </span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-low text-on-surface-variant transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {isDQ ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              {company.score.dimensions[0]?.evidence ?? 'Hospital or health system — outside ICP.'}
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">How will you approach them?</p>
                <div className="flex gap-2">
                  {CHANNELS.map(({ id, label, Icon }) => (
                    <button key={id} onClick={() => toggle(id)}
                      className={cn('flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all',
                        channels.includes(id)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      )}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setChannels(['call','email','linkedin'])}
                  className="mt-2 text-xs text-primary font-semibold hover:underline">
                  Select all
                </button>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Context before outreach..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
              </div>
            </>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <strong>Save failed:</strong> {saveError}
              {saveError.includes('does not exist') && (
                <p className="mt-1 text-red-600">The Supabase <code>prospects</code> table is missing — run the SQL schema in your Supabase dashboard first.</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => save('passed')} disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-low transition-colors disabled:opacity-50">
              Pass
            </button>
            {!isDQ && (
              <button onClick={() => save('active')} disabled={saving || !channels.length}
                className="flex-[2] py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors shadow-glow-primary disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                {saving ? savingStatus || 'Adding…' : 'Add to Pipeline →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
