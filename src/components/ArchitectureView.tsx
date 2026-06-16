'use client'

import {
  Phone,
  Mail,
  Linkedin,
  Search,
  Target,
  CheckCircle,
  Sparkles,
  RotateCcw,
  Layers,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

// ─── Data ────────────────────────────────────────────────────────────────────

const TIMELINE = [
  {
    day: 1,
    channel: 'email' as const,
    touch: 'Intro Email A/B Test',
    tone: ['formal', 'informal'],
    goal: 'Start conversation with relevance',
  },
  {
    day: 3,
    channel: 'phone' as const,
    touch: 'Call + Voicemail',
    tone: ['conversational'],
    goal: 'Add human touch, ask 1 key question',
  },
  {
    day: 5,
    channel: 'email' as const,
    touch: 'Follow-up Email (Business Cost)',
    tone: ['formal', 'informal'],
    goal: 'Quantify the hidden cost',
  },
  {
    day: 8,
    channel: 'linkedin' as const,
    touch: 'LinkedIn Message',
    tone: ['conversational'],
    goal: 'Soft question, not a pitch',
  },
  {
    day: 10,
    channel: 'phone' as const,
    touch: 'Call + Voicemail',
    tone: ['conversational'],
    goal: 'Try to connect live',
  },
  {
    day: 12,
    channel: 'email' as const,
    touch: 'Peer Pattern Email',
    tone: ['formal', 'informal'],
    goal: 'Share peer insight + value',
  },
  {
    day: 14,
    channel: 'email' as const,
    touch: 'Breakup / Close Loop',
    tone: ['formal'],
    goal: 'Close respectfully, leave door open',
  },
]

const PERSONAS = [
  {
    title: 'COO / Ops / Integration',
    color: 'blue',
    points: [
      'New practice onboarding',
      'Workflow standardization',
      'Site-level inconsistency',
      'Reduce manual work',
    ],
    cta: 'Show where intake breaks during integration',
  },
  {
    title: 'CFO / Finance',
    color: 'green',
    points: [
      'Labor cost',
      'Missed booked visits',
      'Margin protection',
      'Cost of unworked referrals',
    ],
    cta: 'Walk you through the patient-loss math',
  },
  {
    title: 'Patient Access / Rev Cycle',
    color: 'orange',
    points: [
      'Referral queues',
      'Fax processing',
      'Call-back speed',
      'Appointment conversion',
    ],
    cta: 'Compare notes on where referrals slow down',
  },
  {
    title: 'CEO / President',
    color: 'purple',
    points: [
      'Scaling the platform',
      'Protect growth from operational drag',
      'Independent-practice success',
      'Acquisition integration',
    ],
    cta: 'Show how front-office automation supports scale',
  },
]

const PIPELINE_STEPS = [
  {
    num: 1,
    icon: Search,
    title: 'Research',
    desc: 'Exa web crawl across company site, LinkedIn, PitchBook, news. Gather firmographics, pain signals, contact data.',
  },
  {
    num: 2,
    icon: Target,
    title: 'Classify',
    desc: 'ICP filter first: hospital/health system → auto-DQ. Then account type (MSO vs. independent vs. federation).',
  },
  {
    num: 3,
    icon: Sparkles,
    title: 'Score',
    desc: 'Groq llama-3.3-70b at temp=0, seed=42 for deterministic 6-dimension scoring. Cached 24h per domain+product+tags.',
  },
  {
    num: 4,
    icon: CheckCircle,
    title: 'Decide',
    desc: 'CALL NOW (≥80) · SEQUENCE (60–79) · DEPRIORITIZE (<60) · DISQUALIFIED · INSUFFICIENT (<3 sources)',
  },
  {
    num: 5,
    icon: Phone,
    title: 'Outreach',
    desc: '14-day multi-channel sequence: email A/B test → LinkedIn → call → email → LinkedIn → call → breakup. Persona-specific angles.',
  },
  {
    num: 6,
    icon: RotateCcw,
    title: 'Feedback',
    desc: 'Score corrections, call outcomes, FAQ thumbs, activity logs — all feed back into ML reinforcement and score calibration.',
  },
]

const ML_LOOPS = [
  {
    title: 'Score Corrections',
    color: 'emerald',
    desc: 'BDR manually adjusts dimension scores in the pipeline. Delta saved as training signal.',
    example:
      'Example: BDR lowers Buying Committee from 15→10 for a company with known decision-fragmentation. Next similar company scores lower on this dimension automatically.',
  },
  {
    title: 'Call Outcomes',
    color: 'blue',
    desc: 'Picked up / No answer / Voicemail / Wrong person — logged per contact per sequence day.',
    example:
      'Patterns: which day in the sequence has highest pickup rate? Which persona answers? Feed into recommended call timing per account type.',
  },
  {
    title: 'FAQ Effectiveness',
    color: 'amber',
    desc: 'Playbook objection responses rated worked/didn\'t by the BDR after each call.',
    example:
      'High-thumbs answers surface first. Low-thumbs answers get flagged for revision.',
  },
  {
    title: 'Engagement Signals',
    color: 'purple',
    desc: 'Email opens, LinkedIn accepts, reply persona — fed back to refine persona-priority logic.',
    example:
      'If Patient Access persona replies 2x more than CEO persona across 50 touches, system re-ranks persona priority for similar ICP accounts.',
  },
]

const DIMENSION_DATA = [
  { name: 'ICP Fit', weight: 30, color: '#10b981' },
  { name: 'Workflow Pain', weight: 20, color: '#f59e0b' },
  { name: 'Scale/Complexity', weight: 15, color: '#6366f1' },
  { name: 'Buying Committee', weight: 15, color: '#3b82f6' },
  { name: 'Growth Pressure', weight: 10, color: '#8b5cf6' },
  { name: 'Messaging Fit', weight: 10, color: '#ec4899' },
]

const SIGNAL_DATA = [
  { name: 'Not hospital/system', score: 15 },
  { name: 'PE-backed', score: 12 },
  { name: 'Target specialty match', score: 11 },
  { name: 'Multi-specialty', score: 10 },
  { name: 'Multi-location', score: 9 },
  { name: 'Named COO/ops', score: 8 },
  { name: 'Headcount 50-500', score: 8 },
  { name: 'Recent funding signal', score: 7 },
]

// ─── Small helpers ────────────────────────────────────────────────────────────

const CHANNEL_ICON = {
  email: Mail,
  phone: Phone,
  linkedin: Linkedin,
}

const CHANNEL_COLOR = {
  email: 'text-blue-500 bg-blue-50',
  phone: 'text-emerald-500 bg-emerald-50',
  linkedin: 'text-indigo-500 bg-indigo-50',
}

const TONE_COLOR: Record<string, string> = {
  formal: 'bg-slate-100 text-slate-700',
  informal: 'bg-amber-50 text-amber-700',
  conversational: 'bg-emerald-50 text-emerald-700',
}

const PERSONA_COLORS: Record<string, { border: string; badge: string; heading: string; bullet: string; cta: string }> = {
  blue: {
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    heading: 'text-blue-800',
    bullet: 'bg-blue-400',
    cta: 'text-blue-600',
  },
  green: {
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    heading: 'text-emerald-800',
    bullet: 'bg-emerald-400',
    cta: 'text-emerald-600',
  },
  orange: {
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    heading: 'text-orange-800',
    bullet: 'bg-orange-400',
    cta: 'text-orange-600',
  },
  purple: {
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    heading: 'text-purple-800',
    bullet: 'bg-purple-400',
    cta: 'text-purple-600',
  },
}

const ML_COLORS: Record<string, { ring: string; badge: string; heading: string }> = {
  emerald: { ring: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', heading: 'text-emerald-800' },
  blue: { ring: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', heading: 'text-blue-800' },
  amber: { ring: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', heading: 'text-amber-800' },
  purple: { ring: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', heading: 'text-purple-800' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-6 py-4 border-b border-outline-variant bg-surface-low">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
        {label}
      </p>
    </div>
  )
}

function Arrow({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex justify-center py-1">
        <div className="flex flex-col items-center gap-0">
          <div className="w-px h-4 bg-slate-300" />
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center px-1 text-slate-400 font-bold select-none">
      →
    </div>
  )
}

// ─── Section 1: Timeline + Flowchart ─────────────────────────────────────────

function TimelineTable() {
  return (
    <div className="flex flex-col gap-2">
      {TIMELINE.map((row) => {
        const Icon = CHANNEL_ICON[row.channel]
        const chanColor = CHANNEL_COLOR[row.channel]
        return (
          <div
            key={row.day}
            className="flex items-start gap-3 bg-white border border-outline-variant rounded-xl p-3"
          >
            {/* Day badge */}
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-800 text-white flex flex-col items-center justify-center leading-tight">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Day</span>
              <span className="text-lg font-extrabold">{row.day}</span>
            </div>

            {/* Channel icon */}
            <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-1.5', chanColor)}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface leading-tight">{row.touch}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {row.tone.map((t) => (
                  <span key={t} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', TONE_COLOR[t])}>
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-1 leading-snug">{row.goal}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FlowPersonaBox({
  title,
  angle,
  color,
}: {
  title: string
  angle: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const borders: Record<string, string> = {
    blue: 'border-blue-400 bg-blue-50',
    green: 'border-emerald-400 bg-emerald-50',
    orange: 'border-orange-400 bg-orange-50',
    purple: 'border-purple-400 bg-purple-50',
  }
  const titles: Record<string, string> = {
    blue: 'text-blue-800',
    green: 'text-emerald-800',
    orange: 'text-orange-800',
    purple: 'text-purple-800',
  }
  return (
    <div className={cn('border-2 rounded-xl p-3 flex-1 min-w-0', borders[color])}>
      <p className={cn('text-xs font-bold leading-tight', titles[color])}>{title}</p>
      <p className="text-[10px] text-slate-600 mt-1 leading-snug">{angle}</p>
    </div>
  )
}

function DiamondShape({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-2">
      <div className="relative w-44 h-12 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-amber-100 border-2 border-amber-400"
          style={{ transform: 'rotate(6deg) skewX(-12deg)' }}
        />
        <p className="relative text-xs font-bold text-amber-800 text-center z-10 px-2">{label}</p>
      </div>
    </div>
  )
}

function OutcomeBranch({
  signal,
  action,
  color,
}: {
  signal: string
  action: string
  color: string
}) {
  const colorMap: Record<string, { outer: string; inner: string }> = {
    gray: { outer: 'bg-slate-100 border-slate-300', inner: 'text-slate-700' },
    amber: { outer: 'bg-amber-50 border-amber-300', inner: 'text-amber-800' },
    blue: { outer: 'bg-blue-50 border-blue-300', inner: 'text-blue-800' },
    emerald: { outer: 'bg-emerald-50 border-emerald-300', inner: 'text-emerald-800' },
    slate: { outer: 'bg-slate-50 border-slate-400', inner: 'text-slate-700' },
  }
  const c = colorMap[color] ?? colorMap['gray']
  return (
    <div className={cn('border rounded-xl p-2.5 flex-1 min-w-0 text-center', c.outer)}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wide', c.inner)}>{signal}</p>
      <div className="my-1 border-t border-dashed border-current opacity-30" />
      <p className={cn('text-[10px] leading-snug', c.inner)}>{action}</p>
    </div>
  )
}

function CampaignFlowchart() {
  return (
    <div className="flex flex-col gap-0 text-sm">
      {/* Start */}
      <div className="flex justify-center">
        <div className="bg-indigo-600 text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-md">
          Start: Target Account
        </div>
      </div>

      <Arrow vertical />

      {/* Identify Persona */}
      <div className="flex justify-center">
        <div className="bg-slate-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold w-64 text-center shadow">
          Identify Persona
        </div>
      </div>

      <Arrow vertical />

      {/* Four personas */}
      <div className="flex gap-2">
        <FlowPersonaBox
          title="COO / Ops / Integration"
          angle="Angle: New-site intake standardization"
          color="blue"
        />
        <FlowPersonaBox
          title="CFO / Finance"
          angle="Angle: Missed booked visits + labor leverage"
          color="green"
        />
        <FlowPersonaBox
          title="Patient Access / Rev Cycle"
          angle="Angle: Referrals, faxes, call-backs, scheduling"
          color="orange"
        />
        <FlowPersonaBox
          title="CEO / President"
          angle="Angle: Scale platform without admin drag"
          color="purple"
        />
      </div>

      <Arrow vertical />

      {/* Execute day 1 */}
      <div className="flex justify-center">
        <div className="bg-slate-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold w-72 text-center shadow">
          Execute Day 1 Email + LinkedIn
        </div>
      </div>

      <Arrow vertical />

      {/* Diamond */}
      <DiamondShape label="Engagement Signal?" />

      <Arrow vertical />

      {/* 5 outcome branches */}
      <div className="flex gap-2">
        <OutcomeBranch signal="Opened, No Reply" action="Day 5 Email (Pattern Interrupt)" color="gray" />
        <OutcomeBranch signal="No Open" action="Send Cleaner Operational Subject" color="amber" />
        <OutcomeBranch signal="LinkedIn Accepted" action="Send Soft Question, No Pitch" color="blue" />
        <OutcomeBranch signal="Call Connected" action="Run Discovery Opener" color="emerald" />
        <OutcomeBranch signal="Reply – Wrong Person" action="Ask for Right Owner + Restart" color="slate" />
      </div>

      <Arrow vertical />

      {/* Continue sequence */}
      <div className="flex justify-center">
        <div className="bg-slate-100 border border-slate-300 text-slate-700 rounded-xl px-6 py-2.5 text-xs font-semibold text-center shadow-sm">
          Continue Sequence: Day 8 → Day 10 → Day 12 → Day 14
        </div>
      </div>

      <Arrow vertical />

      {/* Meeting booked */}
      <div className="flex justify-center">
        <div className="bg-emerald-600 text-white rounded-xl px-8 py-3 text-sm font-bold shadow-md">
          🗓 Meeting Booked
        </div>
      </div>
    </div>
  )
}

// ─── Section 3: Pipeline ──────────────────────────────────────────────────────

function PipelineStep({
  step,
  isLast,
}: {
  step: (typeof PIPELINE_STEPS)[number]
  isLast: boolean
}) {
  const Icon = step.icon
  return (
    <div className="flex items-start gap-2 flex-1 min-w-0">
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div className="bg-white border border-outline-variant rounded-xl p-4 w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {step.num}
            </div>
            <Icon className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <p className="text-sm font-bold text-on-surface">{step.title}</p>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
        </div>
      </div>
      {!isLast && (
        <div className="flex items-center justify-center pt-6 flex-shrink-0">
          <span className="text-slate-400 font-bold text-lg">→</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArchitectureView() {
  return (
    <div className="space-y-8">

      {/* ── SECTION 1: 14-Day Campaign Workflow ── */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
        <SectionHeader label="14-Day Campaign Workflow" />
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left: Timeline */}
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
                Outreach Sequence
              </p>
              <TimelineTable />
            </div>

            {/* Right: Flowchart */}
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
                Dynamic Campaign Workflow
              </p>
              <div className="bg-slate-50 border border-outline-variant rounded-2xl p-5">
                <CampaignFlowchart />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Persona-Based Angles ── */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
        <SectionHeader label="Persona-Based Angles" />
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {PERSONAS.map((p) => {
              const c = PERSONA_COLORS[p.color]
              return (
                <div
                  key={p.title}
                  className={cn(
                    'bg-white border-2 rounded-xl p-4 flex flex-col gap-3',
                    c.border
                  )}
                >
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full w-fit', c.badge)}>
                    {p.title}
                  </span>
                  <ul className="flex flex-col gap-1.5 flex-1">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', c.bullet)} />
                        <span className="text-xs text-on-surface-variant leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={cn('text-[11px] font-semibold leading-snug border-t border-outline-variant pt-3', c.cta)}>
                    "{p.cta}"
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: System Orchestration Loop ── */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
        <SectionHeader label="Intelligence Engine · How It Works" />
        <div className="p-6">
          {/* Desktop: horizontal pipeline */}
          <div className="hidden lg:flex items-start gap-0">
            {PIPELINE_STEPS.map((step, i) => (
              <PipelineStep key={step.num} step={step} isLast={i === PIPELINE_STEPS.length - 1} />
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex flex-col gap-3 lg:hidden">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.num}>
                  <div className="bg-white border border-outline-variant rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {step.num}
                      </div>
                      <Icon className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                      <p className="text-sm font-bold text-on-surface">{step.title}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <span className="text-slate-400 font-bold">↓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: ML Reinforcement Loops ── */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
        <SectionHeader label="ML Reinforcement · How the System Learns" />
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs text-on-surface-variant">
            Every interaction is a training signal. The engine improves with each outreach cycle.
          </p>
        </div>
        <div className="p-6 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ML_LOOPS.map((loop) => {
              const c = ML_COLORS[loop.color]
              return (
                <div
                  key={loop.title}
                  className={cn('bg-white border-2 rounded-xl p-4 flex flex-col gap-3', c.ring)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm font-bold', c.heading)}>{loop.title}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', c.badge)}>
                      Loop Active
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{loop.desc}</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[11px] text-slate-600 leading-relaxed italic">{loop.example}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 5: Feature Importance Dashboard ── */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-card overflow-hidden">
        <SectionHeader label="Feature Importance · What Drives the Score" />
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* Chart 1: Scoring Dimensions */}
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
                Scoring Dimensions (out of 100)
              </p>
              <div className="bg-white border border-outline-variant rounded-xl p-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={DIMENSION_DATA}
                    layout="vertical"
                    margin={{ top: 4, right: 40, left: 16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, 35]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fill: '#374151' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      formatter={(value) => [`${value} pts`, 'Max Weight']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={18}>
                      {DIMENSION_DATA.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Signal Features */}
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
                Signal Features (Expert Weight Matrix)
              </p>
              <div className="bg-white border border-outline-variant rounded-xl p-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={SIGNAL_DATA}
                    layout="vertical"
                    margin={{ top: 4, right: 40, left: 16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, 18]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{ fontSize: 11, fill: '#374151' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      formatter={(value) => [`${value} pts`, 'Signal Weight']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
