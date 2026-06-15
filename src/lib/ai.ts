import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import type { CompanyResult, OutcomeScore, CallBrief } from './types'

function getGoogle() {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
}

async function generate(prompt: string): Promise<string> {
  try {
    const google = getGoogle()
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
      maxTokens: 1500,
    })
    return text
  } catch (e) {
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
        }),
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content ?? ''
    }
    throw e
  }
}

export async function scoreCompany(
  companyData: Partial<CompanyResult>,
  product: string,
): Promise<OutcomeScore> {
  const prompt = `You are a B2B sales intelligence engine scoring healthcare companies as prospects.

PRODUCT BEING SOLD: ${product || 'Healthcare workflow automation platform'}

COMPANY DATA:
Name: ${companyData.name}
Domain: ${companyData.domain}
Industry: ${companyData.industry}
Headcount: ${companyData.headcount}
Funding: ${companyData.funding}
Revenue: ${companyData.revenue}
Description: ${companyData.description}
Contacts found: ${companyData.contacts?.map(c => `${c.name} (${c.title})`).join(', ')}
Pain points: ${companyData.inputData?.filter(d => d.type === 'Pain Point').map(d => d.value).join(' | ')}
Buying signals: ${companyData.inputData?.filter(d => d.type === 'Buying Signal').map(d => d.value).join(' | ')}

HARD DISQUALIFICATION RULE (apply FIRST):
If the company is a hospital system, academic medical center, integrated delivery network, or government health system — set "disqualified": true and set ALL dimension scores to 0. These entities have 12-18 month procurement cycles, committee buying structures, and rigid IT governance that makes them a poor ICP fit. Examples that must be DQ'd: Kaiser Permanente, Mayo Clinic, HCA Healthcare, NYU Langone, Baylor Scott & White Health, Sutter Health, CommonSpirit, Ascension, UPMC, any entity with "Health System" or "Hospital" as primary identifier.

SCORING MATRIX (total out of 100):
1. ICP Fit /30 — Is this an independent physician group, PE-backed MSO, or specialty network? Score high (25-30) for multi-specialty PE-backed MSOs. Score medium (15-20) for large independent specialty groups. Score 0 if hospital/health system (DQ).
2. Workflow Pain /20 — Does their specialty generate high fax, referral, scheduling, or prior auth volume? ENT, oncology, cardiology, ortho = high pain (15-20). Primary care = medium (10-14).
3. Scale / Complexity /15 — Multi-site? 50+ providers? Enough complexity to justify a platform solution. Single-site small groups score low (3-7).
4. Buying Committee /15 — Is there a named, reachable decision-maker (COO, VP Ops, CMO, CEO)? Recent leadership hires signal readiness. Score high if specific exec is identifiable.
5. Growth Pressure /10 — Actively acquiring practices? Under PE hold-period pressure to prove operational ROI? Score high if acquisition activity or PE backing is confirmed.
6. Messaging /10 — Does the product story land cleanly for this specific account type and specialty? High if clear pain-to-product match.

Return ONLY valid JSON (no markdown, no code block):
{
  "disqualified": false,
  "dimensions": [
    { "name": "ICP Fit", "maxScore": 30, "score": 25, "evidence": "specific evidence here", "confidence": "High", "researchUrl": "" },
    { "name": "Workflow Pain", "maxScore": 20, "score": 16, "evidence": "specific evidence here", "confidence": "High", "researchUrl": "" },
    { "name": "Scale / Complexity", "maxScore": 15, "score": 12, "evidence": "specific evidence here", "confidence": "Medium", "researchUrl": "" },
    { "name": "Buying Committee", "maxScore": 15, "score": 10, "evidence": "specific evidence here", "confidence": "Medium", "researchUrl": "" },
    { "name": "Growth Pressure", "maxScore": 10, "score": 8, "evidence": "specific evidence here", "confidence": "High", "researchUrl": "" },
    { "name": "Messaging", "maxScore": 10, "score": 7, "evidence": "specific evidence here", "confidence": "High", "researchUrl": "" }
  ]
}`

  const raw = await generate(prompt)
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')

  const dimensions = json.dimensions ?? []
  const total = dimensions.reduce((sum: number, d: { score: number }) => sum + d.score, 0)
  const disqualified = json.disqualified === true

  return {
    dimensions,
    total: Math.round(total),
    status: disqualified ? 'DISQUALIFIED' : total >= 80 ? 'CALL NOW' : total >= 60 ? 'SEQUENCE' : 'DEPRIORITIZE',
  }
}

export async function generateBrief(
  company: Partial<CompanyResult>,
  product: string,
): Promise<CallBrief> {
  const contact = company.contacts?.[0]
  const painPoints = company.inputData?.filter(d => d.type === 'Pain Point') ?? []
  const signals = company.inputData?.filter(d => d.type === 'Buying Signal') ?? []

  const prompt = `You are a world-class B2B sales coach. Generate personalized outreach content for 3 channels.

PRODUCT: ${product || 'Healthcare workflow automation platform'}
COMPANY: ${company.name} (${company.domain})
BEST CONTACT: ${contact?.name ?? 'Unknown'}, ${contact?.title ?? 'Decision Maker'}
PAIN POINTS: ${painPoints.map(p => p.value).join(' | ')}
BUYING SIGNALS: ${signals.map(s => s.value).join(' | ')}
SCORE: ${company.score?.total}/100 — ${company.score?.status}

Return ONLY valid JSON (no markdown):
{
  "openWith": "Cold call opener — one sentence, references something specific and real about this company, creates instant relevance",
  "referenceOnCall": [
    { "point": "specific talking point for the call", "url": "source url" },
    { "point": "specific talking point", "url": "source url" }
  ],
  "emailSubjectLine": "Email subject — under 8 words, specific to their situation, not generic",
  "personalizedFirstLine": "Email first line — under 25 words, references a real signal, conversational",
  "emailBody": "Full 3-paragraph cold email. Para 1 (2 sentences): hook that references their specific situation from pain points/signals. Para 2 (2 sentences): concise value prop for this exact account type. Para 3 (1 sentence): low-friction CTA asking for a 15-min call. Total under 130 words.",
  "linkedinDM": "LinkedIn DM — under 200 characters, warm and specific, references one real thing about them, opens a conversation without pitching",
  "linkedinConnectionNote": "Connection request note — under 100 characters, personalized, no pitch",
  "stillMissing": [
    { "item": "what is still missing", "where": "where to find it" }
  ],
  "painPoints": [
    { "pain": "specific pain point", "source_url": "url", "relevance": "direct or indirect" }
  ],
  "researchLinks": ["url1", "url2"]
}`

  const raw = await generate(prompt)
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
  return json as CallBrief
}
