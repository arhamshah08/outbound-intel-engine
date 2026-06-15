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
}

export interface CallBrief {
  // Call
  openWith: string
  referenceOnCall: { point: string; url: string }[]
  // Email
  emailSubjectLine: string
  personalizedFirstLine: string
  emailBody?: string
  // LinkedIn
  linkedinDM?: string
  linkedinConnectionNote?: string
  // Meta
  stillMissing: { item: string; where: string }[]
  painPoints: PainPoint[]
  researchLinks: string[]
}

export interface OutcomeScore {
  dimensions: ScoreDimension[]
  total: number
  status: 'CALL NOW' | 'SEQUENCE' | 'DEPRIORITIZE' | 'DISQUALIFIED'
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
}
