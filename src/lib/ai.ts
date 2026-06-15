import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import type { CompanyResult, OutcomeScore, CallBrief, Contact, Playbook, FAQ } from './types'

function getGoogle() {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

async function generate(prompt: string, maxTokens = 800): Promise<string> {
  // 1️⃣ Local Ollama — free, runs on your machine
  const ollamaUrl = process.env.OLLAMA_BASE_URL
  if (ollamaUrl) {
    try {
      const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b'
      const res = await raceTimeout(
        fetch(`${ollamaUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            stream: false,
          }),
        }).then(r => r.json()),
        120000,
      )
      const text = res.choices?.[0]?.message?.content ?? ''
      if (text) { console.log(`[generate] Ollama (${model}) OK`); return text }
      console.error('[generate] Ollama empty response:', JSON.stringify(res).slice(0, 200))
    } catch (e) {
      console.error('[generate] Ollama failed:', e instanceof Error ? e.message : String(e))
    }
  }

  // 2️⃣ Groq — free, very fast cloud inference
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const res = await raceTimeout(
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
          }),
        }).then(r => r.json()),
        30000,
      )
      const text = res.choices?.[0]?.message?.content ?? ''
      if (text) { console.log('[generate] Groq OK'); return text }
      console.error('[generate] Groq empty:', JSON.stringify(res).slice(0, 200))
    } catch (e) {
      console.error('[generate] Groq failed:', e instanceof Error ? e.message : String(e))
    }
  }

  // 4️⃣ Anthropic Claude
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const res = await raceTimeout(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
          }),
        }).then(r => r.json()),
        45000,
      )
      const text = res.content?.[0]?.text ?? ''
      if (text) return text
      console.error('[generate] Anthropic empty response:', JSON.stringify(res).slice(0, 200))
    } catch (e) {
      console.error('[generate] Anthropic failed:', e instanceof Error ? e.message : String(e))
    }
  }

  // 5️⃣ OpenAI — if key is set
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const res = await raceTimeout(
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }),
        }).then(r => r.json()),
        45000,
      )
      const text = res.choices?.[0]?.message?.content ?? ''
      if (text) return text
    } catch (e) {
      console.error('[generate] OpenAI failed:', e instanceof Error ? e.message : String(e))
    }
  }

  // 6️⃣ Google Gemini — last resort, known to be slow
  try {
    const google = getGoogle()
    const aiCall = generateText({ model: google('gemini-2.0-flash'), prompt, maxTokens })
    const { text } = await raceTimeout(aiCall, 90000)
    return text
  } catch (e) {
    console.error('[generate] Gemini failed:', e instanceof Error ? e.message : String(e))
    throw e
  }
}

// Cloud-only generate for scoring — skips local Ollama (too small for reliable scoring)
async function generateScoring(prompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const res = await raceTimeout(
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 700 }),
        }).then(r => r.json()),
        30000,
      )
      const text = res.choices?.[0]?.message?.content ?? ''
      if (text) { console.log('[scoring] Groq OK'); return text }
      console.error('[scoring] Groq empty:', JSON.stringify(res).slice(0, 200))
    } catch (e) {
      console.error('[scoring] Groq failed:', e instanceof Error ? e.message : String(e))
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const res = await raceTimeout(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
        }).then(r => r.json()),
        45000,
      )
      const text = res.content?.[0]?.text ?? ''
      if (text) { console.log('[scoring] Anthropic OK'); return text }
    } catch (e) {
      console.error('[scoring] Anthropic failed:', e instanceof Error ? e.message : String(e))
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const res = await raceTimeout(
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 700 }),
        }).then(r => r.json()),
        45000,
      )
      const text = res.choices?.[0]?.message?.content ?? ''
      if (text) return text
    } catch (e) {
      console.error('[scoring] OpenAI failed:', e instanceof Error ? e.message : String(e))
    }
  }

  try {
    const google = getGoogle()
    const { text } = await raceTimeout(generateText({ model: google('gemini-2.0-flash'), prompt, maxTokens: 700 }), 90000)
    return text
  } catch (e) {
    console.error('[scoring] Gemini failed:', e instanceof Error ? e.message : String(e))
    throw e
  }
}

export async function scoreCompany(
  companyData: Partial<CompanyResult>,
  product: string,
  tags?: string[],
): Promise<OutcomeScore> {
  const tagLine = tags && tags.length > 0
    ? `\nICP TAGS (use these as additional must-have criteria when scoring ICP Fit): ${tags.join(', ')}`
    : ''
  const prompt = `You are a B2B sales intelligence engine scoring healthcare companies as prospects.

PRODUCT BEING SOLD: ${product || 'Healthcare workflow automation platform'}${tagLine}

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

Return ONLY valid JSON (no markdown, no code block). Scores must reflect ${companyData.name} specifically — generate unique integers based on the evidence above, not placeholder values:
{
  "disqualified": false,
  "dimensions": [
    { "name": "ICP Fit", "maxScore": 30, "score": 0, "evidence": "evidence about ICP fit from data above", "confidence": "High", "researchUrl": "" },
    { "name": "Workflow Pain", "maxScore": 20, "score": 0, "evidence": "evidence about workflow pain", "confidence": "High", "researchUrl": "" },
    { "name": "Scale / Complexity", "maxScore": 15, "score": 0, "evidence": "evidence about scale", "confidence": "Medium", "researchUrl": "" },
    { "name": "Buying Committee", "maxScore": 15, "score": 0, "evidence": "evidence about decision-makers", "confidence": "Medium", "researchUrl": "" },
    { "name": "Growth Pressure", "maxScore": 10, "score": 0, "evidence": "evidence about growth/PE pressure", "confidence": "High", "researchUrl": "" },
    { "name": "Messaging", "maxScore": 10, "score": 0, "evidence": "evidence about messaging fit", "confidence": "High", "researchUrl": "" }
  ]
}
Replace each "score": 0 with a real integer 0-maxScore based on the company data. Replace each "evidence" string with a specific finding from the data above.`

  try {
    const raw = await generateScoring(prompt)
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    const dimensions = json.dimensions ?? []
    const total = dimensions.reduce((sum: number, d: { score: number }) => sum + d.score, 0)
    const disqualified = json.disqualified === true
    return {
      dimensions,
      total: Math.round(total),
      status: disqualified ? 'DISQUALIFIED' : total >= 80 ? 'CALL NOW' : total >= 60 ? 'SEQUENCE' : 'DEPRIORITIZE',
    }
  } catch (e) {
    console.error('[scoreCompany] AI scoring failed:', e instanceof Error ? e.message : String(e))
    // Return data-only result — company still shows with intel, score marked as failed
    return {
      dimensions: [
        { name: 'ICP Fit', maxScore: 30, score: 0, evidence: 'AI scoring unavailable — review intel manually', confidence: 'Low' as const },
        { name: 'Workflow Pain', maxScore: 20, score: 0, evidence: 'AI scoring unavailable', confidence: 'Low' as const },
        { name: 'Scale / Complexity', maxScore: 15, score: 0, evidence: 'AI scoring unavailable', confidence: 'Low' as const },
        { name: 'Buying Committee', maxScore: 15, score: 0, evidence: 'AI scoring unavailable', confidence: 'Low' as const },
        { name: 'Growth Pressure', maxScore: 10, score: 0, evidence: 'AI scoring unavailable', confidence: 'Low' as const },
        { name: 'Messaging', maxScore: 10, score: 0, evidence: 'AI scoring unavailable', confidence: 'Low' as const },
      ],
      total: 0,
      status: 'DEPRIORITIZE',
    }
  }
}

export async function generateBrief(
  company: Partial<CompanyResult>,
  product: string,
): Promise<CallBrief> {
  const contact = company.contacts?.[0]
  const painPoints = company.inputData?.filter(d => d.type === 'Pain Point') ?? []
  const signals = company.inputData?.filter(d => d.type === 'Buying Signal') ?? []
  const allContacts = company.contacts ?? []

  const prompt = `You are a world-class B2B sales strategist and coach. Generate a complete outreach package for this account.

PRODUCT BEING SOLD: ${product || 'Healthcare workflow automation platform'}

ACCOUNT INTELLIGENCE:
Company: ${company.name} (${company.domain})
Industry: ${company.industry} | Headcount: ${company.headcount} | Funding: ${company.funding}
${company.peBacker ? `PE Backer: ${company.peBacker}` : ''}
${company.numLocations ? `Locations: ${company.numLocations}` : ''}
${company.emrSystem ? `EMR System: ${company.emrSystem}` : ''}
${company.specialties ? `Specialties: ${company.specialties}` : ''}
${company.recentNews ? `Recent News: ${company.recentNews}` : ''}
${company.location ? `HQ: ${company.location}` : ''}
Description: ${company.description}
Score: ${company.score?.total}/100 — ${company.score?.status}

PAIN TRIGGERS:
${painPoints.map((p, i) => `${i+1}. ${p.value}`).join('\n')}

BUYING SIGNALS:
${signals.map(s => s.value).join('\n')}

DECISION MAKERS:
${allContacts.map((c, i) => `${i+1}. ${c.name} — ${c.title}${c.hook ? `. Hook: ${c.hook}` : ''}${c.angle ? `. Angle: ${c.angle}` : ''}`).join('\n')}

PRIMARY CONTACT: ${contact?.name ?? 'Unknown'}, ${contact?.title ?? 'Decision Maker'}

Return ONLY valid JSON (no markdown, no code blocks). Generate rich, specific content — not generic placeholders:

{
  "notes": "## Account Brief: ${company.name}\\n\\n**Snapshot**\\n2-3 sentences covering who they are, size, PE backing, and specialties.\\n\\n**Why They're a Prospect**\\nBullet list of 3-4 specific pain triggers and buying signals with context.\\n\\n**Contact Priority**\\nRanked list of contacts with 1-sentence reason each (name — title — why them).\\n\\n**Best Conversation Angles**\\n3 specific angles based on their situation, each 1-2 sentences.\\n\\n**Research Gaps**\\nBullet list of 2-3 things still unknown and where to find them.",

  "openWith": "One punchy cold call opener — references one specific real thing about this company, under 25 words, creates instant relevance. No generic intros.",

  "referenceOnCall": [
    { "point": "Specific talking point 1 — reference real data from their situation", "url": "" },
    { "point": "Specific talking point 2", "url": "" },
    { "point": "Specific talking point 3 — a challenge angle based on pain triggers", "url": "" }
  ],

  "callBody": "Full structured call script after the opener:\\n\\nPURPOSE LINE: One sentence explaining the 30-second reason for the call.\\n\\nQUALIFYING QUESTIONS:\\n1. [Specific question about their referral/scheduling situation]\\n2. [Question about their current workflow/technology]\\n3. [Question to uncover urgency or timeline]\\n\\nVALUE PROP: 2 sentences specific to their specialty and pain points.\\n\\nCTA: Exact words to ask for the meeting — low-friction, specific.",

  "emailSubjectLine": "Subject line — under 8 words, specific to their situation, not generic. No 'Quick question' or 'Following up'.",

  "personalizedFirstLine": "Email first line — under 30 words, references one specific real signal or news item, conversational.",

  "emailBody": "Full cold email body (after the first line). 3 short paragraphs:\\n\\nPara 1 (2 sentences): Expand on the hook — tie their specific situation to a common problem you solve.\\nPara 2 (2 sentences): Concise value prop specific to their specialty and scale. Include one metric or outcome.\\nPara 3 (1 sentence): Clear low-friction CTA — ask for a 15-min call, not a demo.\\n\\nTotal under 140 words. No generic phrases like 'I hope this finds you well'.",

  "linkedinConnectionNote": "Connection request — under 100 characters, hyper-personalized, NO pitch, mentions something real about them.",

  "linkedinDM": "LinkedIn DM — under 200 characters, references one specific thing, opens a conversation, no pitch. Can be a genuine question.",

  "linkedinSequence": "3-message LinkedIn sequence:\\n\\nMsg 1 (after connecting): Short value-add message, under 80 words, no pitch, shares insight relevant to their situation.\\nMsg 2 (3 days later): Reference a specific pain trigger, 60 words, opens with their challenge not your product.\\nMsg 3 (5 days later): Direct ask for 15-min call, 40 words, specific time suggestion.",

  "stillMissing": [
    { "item": "what is still unknown", "where": "where to find it" }
  ],
  "painPoints": [
    { "pain": "specific pain point", "source_url": "", "relevance": "direct" }
  ],
  "researchLinks": []
}`

  const raw = await generate(prompt, 2500)
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
  return json as CallBrief
}

export async function scoreContacts(
  rawContacts: Contact[],
  companyData: Partial<CompanyResult>,
  product: string,
): Promise<Contact[]> {
  if (!rawContacts.length) return rawContacts

  const prompt = `You are a B2B sales expert. Score and personalize outreach for each executive contact.

PRODUCT: ${product || 'Healthcare workflow automation platform'}
COMPANY: ${companyData.name} (${companyData.industry}, ${companyData.headcount})
DESCRIPTION: ${companyData.description}
PAIN POINTS: ${companyData.inputData?.filter(d => d.type === 'Pain Point').map(d => d.value).join(' | ')}

CONTACTS TO SCORE:
${rawContacts.map((c, i) => `${i + 1}. ${c.name} — ${c.title}${c.whyThis ? `. Context: ${c.whyThis}` : ''}`).join('\n')}

SCORING (out of 80):
- COO, VP Operations, VP Patient Access: 65-80 (direct owner of workflows being automated)
- President, CEO: 60-72 (executive sponsor)
- CFO: 55-65 (economic buyer, approves spend)
- CIO, CTO, VP Technology: 48-60 (technical gatekeeper)
- CMO, VP Clinical: 44-55 (indirect beneficiary)
- VP Integration, VP Transformation: 60-72 (owns broken processes during M&A)
- Other titles: 30-50

For EACH contact return:
- score: integer 0-80
- angle: one sentence — what specific problem/workflow THEY personally own
- hook: one sentence — the exact pitch angle for this person specifically
- whyThis: one sentence — why prioritize this person over others

Return ONLY valid JSON:
{
  "contacts": [
    { "name": "exact name", "score": 72, "angle": "...", "hook": "...", "whyThis": "..." }
  ]
}`

  try {
    const raw = await generate(prompt, 1200)
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    const scored: { name: string; score: number; angle: string; hook: string; whyThis: string }[] = json.contacts ?? []

    const enriched = rawContacts.map(c => {
      const match = scored.find(s =>
        s.name.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) ||
        c.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
      )
      return match ? { ...c, score: match.score, angle: match.angle, hook: match.hook, whyThis: match.whyThis } : c
    })
    return enriched.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  } catch (e) {
    console.error('[scoreContacts] failed:', e instanceof Error ? e.message : String(e))
    return rawContacts
  }
}

export async function generatePlaybook(
  contact: Contact,
  company: Partial<CompanyResult>,
  product: string,
): Promise<{ playbook: Omit<Playbook, 'id' | 'prospect_id' | 'created_at'>; faqs: Omit<FAQ, 'id' | 'prospect_id' | 'created_at'>[] }> {
  const painPoints = company.inputData?.filter(d => d.type === 'Pain Point').map(d => d.value).join(' | ') ?? ''
  const signals    = company.inputData?.filter(d => d.type === 'Buying Signal').map(d => d.value).join(' | ') ?? ''

  const prompt = `You are an elite B2B sales coach building a complete call playbook for a specific executive.

PRODUCT: ${product}
COMPANY: ${company.name} (${company.domain}) — ${company.description}
INDUSTRY: ${company.industry} | HEADCOUNT: ${company.headcount} | FUNDING: ${company.funding}
PAIN POINTS: ${painPoints}
BUYING SIGNALS: ${signals}

TARGET CONTACT: ${contact.name}
TITLE: ${contact.title}
CONTEXT: ${contact.whyThis ?? 'Senior decision-maker'}
HOOK: ${contact.hook ?? contact.angle ?? ''}

Generate a complete, hyper-personalized playbook for this specific person.

Return ONLY valid JSON (no markdown):
{
  "openers": [
    { "id": "o1", "context": "when they answer cold", "text": "exact word-for-word opener" },
    { "id": "o2", "context": "when they seem rushed", "text": "..." },
    { "id": "o3", "context": "when they're warm/curious", "text": "..." },
    { "id": "o4", "context": "voicemail script", "text": "..." },
    { "id": "o5", "context": "email subject line + first line combo", "text": "..." }
  ],
  "if_yes_branches": [
    { "id": "y1", "trigger": "Yes, referral volume is a problem", "response": "exact response..." },
    { "id": "y2", "trigger": "Yes, we're actively integrating acquired practices", "response": "..." },
    { "id": "y3", "trigger": "Yes, I'd be open to a quick demo", "response": "..." },
    { "id": "y4", "trigger": "Yes, but not sure about timing", "response": "..." }
  ],
  "if_no_branches": [
    { "id": "n1", "trigger": "No, we have that handled", "response": "reframe/pivot..." },
    { "id": "n2", "trigger": "No, not the right time", "response": "..." },
    { "id": "n3", "trigger": "No, we already have a vendor", "response": "..." },
    { "id": "n4", "trigger": "No, send me an email", "response": "..." }
  ],
  "faqs": [
    { "category": "product",      "question": "...", "answer": "specific, concise answer tailored to their role" },
    { "category": "integration",  "question": "...", "answer": "..." },
    { "category": "pricing",      "question": "...", "answer": "..." },
    { "category": "timeline",     "question": "...", "answer": "..." },
    { "category": "competition",  "question": "...", "answer": "..." },
    { "category": "objection",    "question": "...", "answer": "..." }
  ]
}

Generate 5 openers, 4 if_yes branches, 4 if_no branches, and exactly 50 FAQs spread across categories:
- product: 12 questions (what it does, how it works, features)
- integration: 8 questions (EMR, IT, data, implementation)
- pricing: 8 questions (cost, ROI, contract, billing)
- timeline: 6 questions (implementation speed, time to value)
- competition: 8 questions (vs alternatives, switching, incumbent)
- objection: 8 questions (not now, wrong person, budget, risk)

Every answer must be specific to ${contact.name}'s role as ${contact.title} at ${company.name}. Not generic.`

  const raw  = await generate(prompt, 4000)
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}')

  const playbook = {
    contact_name:    contact.name,
    contact_title:   contact.title,
    openers:         json.openers         ?? [],
    if_yes_branches: json.if_yes_branches ?? [],
    if_no_branches:  json.if_no_branches  ?? [],
  }

  const faqs: Omit<FAQ, 'id' | 'prospect_id' | 'created_at'>[] = (json.faqs ?? []).map(
    (f: { category: FAQ['category']; question: string; answer: string }) => ({
      contact_name: contact.name,
      question:     f.question,
      answer:       f.answer,
      category:     f.category ?? 'general',
      worked:       null,
      times_used:   0,
    })
  )

  return { playbook, faqs }
}
