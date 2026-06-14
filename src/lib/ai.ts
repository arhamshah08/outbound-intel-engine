import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import type { CompanyResult, OutcomeScore, CallBrief } from './types'

function getGoogle() {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
}

// Also supports OpenAI if key is set
async function generate(prompt: string): Promise<string> {
  // Primary: Google Gemini
  try {
    const google = getGoogle()
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
      maxTokens: 1500,
    })
    return text
  } catch (e) {
    // Fallback: OpenAI
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
  targetTitle: string,
): Promise<OutcomeScore> {
  const prompt = `You are a B2B sales intelligence engine. Score this company as a prospect.

PRODUCT BEING SOLD: ${product || 'B2B SaaS tool'}
TARGET TITLE: ${targetTitle || 'VP of Sales / Head of GTM'}

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

Score each dimension 1-10. Return ONLY valid JSON:
{
  "dimensions": [
    { "name": "ICP Fit — Industry", "weight": 0.20, "score": 8, "evidence": "...", "confidence": "High", "researchUrl": "" },
    { "name": "Buying Signal Strength", "weight": 0.25, "score": 9, "evidence": "...", "confidence": "High", "researchUrl": "" },
    { "name": "Budget Signal", "weight": 0.15, "score": 7, "evidence": "...", "confidence": "Medium", "researchUrl": "crunchbase.com/..." },
    { "name": "Pain-to-Product Match", "weight": 0.20, "score": 8, "evidence": "...", "confidence": "High", "researchUrl": "" },
    { "name": "Contact Quality", "weight": 0.10, "score": 6, "evidence": "...", "confidence": "Low", "researchUrl": "apollo.io/..." },
    { "name": "Growth Signal", "weight": 0.10, "score": 8, "evidence": "...", "confidence": "High", "researchUrl": "" }
  ]
}`

  const raw = await generate(prompt)
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')

  const dimensions = json.dimensions ?? []
  const total = dimensions.reduce((sum: number, d: { weight: number; score: number }) => sum + d.weight * d.score, 0)
  const weighted = dimensions.map((d: { weight: number; score: number; name: string; evidence: string; confidence: string; researchUrl: string }) => ({
    ...d,
    weighted: parseFloat((d.weight * d.score).toFixed(2)),
  }))

  return {
    dimensions: weighted,
    total: parseFloat(total.toFixed(2)),
    status: total >= 8 ? 'CALL NOW' : total >= 6 ? 'SEQUENCE' : 'DEPRIORITIZE',
  }
}

export async function generateBrief(
  company: Partial<CompanyResult>,
  product: string,
  targetTitle: string,
): Promise<CallBrief> {
  const contact = company.contacts?.[0]
  const painPoints = company.inputData?.filter(d => d.type === 'Pain Point') ?? []
  const signals = company.inputData?.filter(d => d.type === 'Buying Signal') ?? []

  const prompt = `You are a world-class B2B sales coach. Write a pre-call brief.

PRODUCT: ${product || 'B2B SaaS tool'}
COMPANY: ${company.name} (${company.domain})
BEST CONTACT: ${contact?.name ?? 'Unknown'}, ${contact?.title ?? targetTitle}
PAIN POINTS: ${painPoints.map(p => p.value).join(' | ')}
BUYING SIGNALS: ${signals.map(s => s.value).join(' | ')}
SCORE: ${company.score?.total}/10 — ${company.score?.status}

Return ONLY valid JSON:
{
  "openWith": "One sentence to open the call that references something specific and real about them",
  "referenceOnCall": [
    { "point": "specific thing to mention", "url": "source url" },
    { "point": "specific thing to mention", "url": "source url" }
  ],
  "stillMissing": [
    { "item": "what is still missing", "where": "where to find it" }
  ],
  "personalizedFirstLine": "Email first line — specific, warm, references real signal, under 25 words",
  "emailSubjectLine": "Short compelling subject line under 8 words",
  "painPoints": [
    { "pain": "specific pain point", "source_url": "url", "relevance": "direct or indirect" }
  ],
  "researchLinks": ["url1", "url2", "url3"]
}`

  const raw = await generate(prompt)
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
  return json as CallBrief
}
