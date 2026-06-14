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
  weight: number
  score: number
  weighted: number
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
  linkedin?: string
  tenure?: string
}

export interface CallBrief {
  openWith: string
  referenceOnCall: { point: string; url: string }[]
  stillMissing: { item: string; where: string }[]
  personalizedFirstLine: string
  emailSubjectLine: string
  painPoints: PainPoint[]
  researchLinks: string[]
}

export interface OutcomeScore {
  dimensions: ScoreDimension[]
  total: number
  status: 'CALL NOW' | 'SEQUENCE' | 'DEPRIORITIZE'
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
  score: OutcomeScore
  callBrief?: CallBrief
  error?: string
}
