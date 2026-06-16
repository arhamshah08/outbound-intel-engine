export interface InputDataPoint {
  id: number
  source: string
  type: string
  value: string
  confidence: 'High' | 'Medium' | 'Low'
  url: string
  gap: boolean
  loopAction?: string
}

export interface ScoreDimension {
  name: string
  maxScore: number
  score: number
  evidence: string
  confidence: 'High' | 'Medium' | 'Low'
  researchUrl?: string
  sourceUrl?: string
  evidenceVerified?: boolean
}

export interface PainPoint {
  pain: string
  source_url: string
  relevance: string
}

export interface Contact {
  name: string
  title: string
  email?: string
  phone?: string
  linkedin?: string
  tenure?: string
  score?: number
  angle?: string
  hook?: string
  whyThis?: string
}

export interface CallBrief {
  notes: string   // comprehensive pre-call account brief
  // Call
  openWith: string
  referenceOnCall: { point: string; url: string }[]
  callBody?: string
  // Email
  emailSubjectLine: string
  personalizedFirstLine: string
  emailBody?: string
  // LinkedIn
  linkedinDM?: string
  linkedinConnectionNote?: string
  linkedinSequence?: string
  // Meta
  stillMissing: { item: string; where: string }[]
  painPoints: PainPoint[]
  researchLinks: string[]
}

export type OutcomeStatus =
  | 'CALL NOW'
  | 'SEQUENCE'
  | 'DEPRIORITIZE'
  | 'DISQUALIFIED'
  | 'INSUFFICIENT'

export interface OutcomeScore {
  dimensions: ScoreDimension[]
  total: number
  status: OutcomeStatus
  sourceCount?: number
  sources?: string[]
}

export interface PlaybookOpener {
  id: string
  context: string
  text: string
}

export interface DecisionBranch {
  id: string
  trigger: string
  response: string
}

export interface Playbook {
  id: string
  prospect_id: string
  contact_name: string
  contact_title: string
  openers: PlaybookOpener[]
  if_yes_branches: DecisionBranch[]
  if_no_branches: DecisionBranch[]
  created_at: string
}

export interface FAQ {
  id: string
  prospect_id: string
  contact_name: string
  question: string
  answer: string
  category: 'pricing' | 'integration' | 'timeline' | 'competition' | 'objection' | 'product' | 'general'
  worked: boolean | null
  times_used: number
  created_at: string
}

export interface ReinforcementLog {
  id: string
  prospect_id: string
  contact_name: string
  contact_title: string
  item_type: 'opener' | 'faq' | 'if_yes' | 'if_no'
  item_ref_id: string | null
  item_text: string
  outcome: 'yes' | 'no'
  context?: string
  created_at: string
}

export interface Prospect {
  id: string
  company_name: string
  domain: string
  industry: string
  headcount: string
  funding: string
  location?: string
  description: string
  score: number
  score_status: string
  score_dimensions: ScoreDimension[]
  approach: string[]
  status: 'active' | 'completed' | 'passed'
  contacts: Contact[]
  pain_points: InputDataPoint[]
  notes: string
  campaign_name: string
  call_brief?: CallBrief
  outcome_status?: 'no_pickup' | 'pickup_no_sale' | 'pickup_sale' | null
  score_corrections?: { dimension: string; original: number; adjusted: number }[]
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  prospect_id: string
  type: 'call' | 'email' | 'linkedin'
  contact_name?: string
  contact_title?: string
  outcome?: string
  notes?: string
  created_at: string
}

export interface CompanyResult {
  id: string
  input: string
  name: string
  domain: string
  industry: string
  headcount: string
  funding: string
  revenue: string
  location?: string
  peBacker?: string        // "Welsh, Carson, Anderson & Stowe" or "KKR"
  numLocations?: string    // "12 sites across 5 states"
  emrSystem?: string       // "Epic", "Athena", "eClinicalWorks"
  specialties?: string     // "Orthopedics, Sports Medicine, Physical Therapy"
  recentNews?: string      // "Acquired 3 practices in Q1 2025"
  description: string
  status: 'pending' | 'enriching' | 'scoring' | 'done' | 'error'
  statusMessage: string
  iteration: number
  inputData: InputDataPoint[]
  contacts: Contact[]
  mainPhone?: string
  score: OutcomeScore
  callBrief?: CallBrief
  error?: string
  missingFields?: { field: string; label: string }[]
}
