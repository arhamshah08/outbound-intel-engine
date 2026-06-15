import { exaSearch, exaDeep, apolloSearch, braveSearch } from './exa'
import { scoreCompany, generateBrief } from './ai'
import type { CompanyResult, InputDataPoint, Contact } from './types'

const COMPANY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Official company name' },
    domain: { type: 'string', description: 'Primary website domain' },
    industry: { type: 'string', description: 'Industry or sector' },
    headcount: { type: 'string', description: 'Number of employees' },
    funding: { type: 'string', description: 'Total funding raised' },
    revenue: { type: 'string', description: 'Annual revenue estimate' },
    description: { type: 'string', description: 'One sentence company summary' },
    buying_signals: { type: 'string', description: 'Comma-separated buying signals (hiring, funding, new exec, expansion)' },
    pain_summary: { type: 'string', description: 'Key business pain points and challenges' },
    key_investors: { type: 'string', description: 'Notable investors or backers' },
    phone: { type: 'string', description: 'Company main phone number' },
  },
  required: ['name', 'domain', 'industry'],
}

const PAIN_SCHEMA = {
  type: 'object',
  properties: {
    pain_1: { type: 'string', description: 'First specific pain point or challenge' },
    pain_1_url: { type: 'string', description: 'Source URL for pain_1' },
    pain_2: { type: 'string', description: 'Second specific pain point or challenge' },
    pain_2_url: { type: 'string', description: 'Source URL for pain_2' },
    pain_3: { type: 'string', description: 'Third specific pain point or challenge' },
    pain_3_url: { type: 'string', description: 'Source URL for pain_3' },
    growth_signal: { type: 'string', description: 'Evidence of growth (hiring, funding, expansion)' },
    growth_signal_url: { type: 'string', description: 'Source URL for growth signal' },
  },
}

type OnProgress = (step: string, message: string, iteration?: number) => void

export async function enrichCompany(
  input: string,
  opts: { product: string; domain?: string },
  onProgress: OnProgress,
): Promise<CompanyResult> {
  const id = Math.random().toString(36).slice(2)
  const inputData: InputDataPoint[] = []
  const contacts: Contact[] = []
  let dataCounter = 1

  function addPoint(source: string, type: string, value: string, confidence: 'High' | 'Medium' | 'Low', url: string, gap = false, loopAction?: string) {
    inputData.push({ id: dataCounter++, source, type, value, confidence, url, gap, loopAction })
  }

  // ── ITERATION 1: Broad discovery ──────────────────────────────────────────
  onProgress('discover', 'Querying Exa · Company overview + pain points + contacts', 1)

  const [discoveryResults, painResults, contactResults] = await Promise.all([
    exaDeep(
      `${input} company overview funding team size revenue investors`,
      'Extract factual company information. Be concise and accurate.',
      COMPANY_SCHEMA,
    ).catch(() => ({ structured: {}, results: [] })),

    exaDeep(
      `${input} company challenges problems hiring difficulties pain points growth 2024 2025`,
      'Find specific business pain points and challenges this company faces. Look for hiring struggles, growth challenges, competitive pressures.',
      PAIN_SCHEMA,
    ).catch(() => ({ structured: {}, results: [] })),

    exaSearch(`${input} leadership team executives COO CMO VP Operations site:linkedin.com`, 3)
      .catch(() => []),
  ])

  onProgress('enrich', 'Processing signals · Building intelligence profile', 1)

  const co = discoveryResults.structured as Record<string, string>
  const pn = painResults.structured as Record<string, string>

  const name = co.name || input
  const domain = co.domain || opts.domain || `${input.toLowerCase().replace(/\s+/g, '')}.com`
  const industry = co.industry || 'Unknown'

  // Add company data points
  if (co.description) addPoint('Exa (deep)', 'Company Overview', co.description, 'High', discoveryResults.results[0]?.url ?? '')
  if (co.industry) addPoint('Exa (deep)', 'Industry', co.industry, 'High', discoveryResults.results[0]?.url ?? '')
  if (co.headcount) addPoint('Exa (deep)', 'Headcount', co.headcount, 'Medium', discoveryResults.results[0]?.url ?? '')
  if (co.funding) addPoint('Exa (deep)', 'Funding', co.funding, 'High', discoveryResults.results[1]?.url ?? '', false)
  if (co.revenue) addPoint('Exa (deep)', 'Revenue', co.revenue, 'Medium', discoveryResults.results[0]?.url ?? '')
  if (co.key_investors) addPoint('Exa (deep)', 'Investors', co.key_investors, 'High', discoveryResults.results[1]?.url ?? '')
  if (co.buying_signals) addPoint('Exa (deep)', 'Buying Signal', co.buying_signals, 'High', discoveryResults.results[0]?.url ?? '')

  // Add pain points
  if (pn.pain_1) addPoint('Exa (deep)', 'Pain Point', pn.pain_1, 'High', pn.pain_1_url ?? painResults.results[0]?.url ?? '')
  if (pn.pain_2) addPoint('Exa (deep)', 'Pain Point', pn.pain_2, 'Medium', pn.pain_2_url ?? painResults.results[1]?.url ?? '')
  if (pn.pain_3) addPoint('Exa (deep)', 'Pain Point', pn.pain_3, 'Medium', pn.pain_3_url ?? painResults.results[2]?.url ?? '')
  if (pn.growth_signal) addPoint('Exa (deep)', 'Buying Signal', pn.growth_signal, 'High', pn.growth_signal_url ?? '')

  // Add contacts from LinkedIn search
  for (const r of contactResults.slice(0, 3)) {
    if (r.highlights?.[0]) {
      const nameMatch = r.title?.split(' - ')?.[0] ?? ''
      const titleMatch = r.title?.split(' - ')?.[1]
      if (nameMatch) {
        const title = titleMatch || 'Executive'
        contacts.push({ name: nameMatch, title, linkedin: r.url })
        addPoint('Exa (auto)', 'Contact', `${nameMatch} — ${title}`, 'High', r.url)
      }
    }
  }

  // ── ITERATION 2: Gap filling ───────────────────────────────────────────────
  const hasEmail = contacts.some(c => c.email)
  const hasPainPoints = inputData.filter(d => d.type === 'Pain Point').length >= 2

  if (!hasEmail || !hasPainPoints) {
    onProgress('contacts', 'Finding decision-makers via Apollo + LinkedIn', 2)

    // Try Apollo for email (primary contact source)
    const apolloContacts = await apolloSearch(domain, 'Chief Operating Officer').catch(() => [])
    if (apolloContacts.length) {
      for (const c of apolloContacts.slice(0, 2)) {
        const existing = contacts.find(x => x.name === c.name)
        if (existing) {
          existing.email = c.email
        } else {
          contacts.push(c)
        }
        addPoint('Apollo', 'Contact + Email', `${c.name} — ${c.title}${c.email ? ` <${c.email}>` : ''}`, 'High', `apollo.io`)
      }
    } else {
      // Apollo not configured — flag as gap
      addPoint('Apollo', 'Email', 'Not found — Apollo key not set', 'Low', 'apollo.io', true, '→ Add APOLLO_API_KEY or search hunter.io/' + domain)
    }

    // Brave fallback for more pain points
    if (!hasPainPoints) {
      const braveResults = await braveSearch(`${name} company reviews challenges 2024 2025`)
      for (const r of braveResults.slice(0, 2)) {
        if (r.highlights?.[0]) {
          addPoint('Brave Search', 'Pain Point', r.highlights[0].slice(0, 200), 'Medium', r.url)
        }
      }
    }
  }

  // ── ITERATION 3: Targeted deep-dive on best available source ───────────────
  const lowConfidence = inputData.filter(d => d.confidence === 'Low' && !d.gap)
  if (lowConfidence.length > 0) {
    onProgress('deep-dive', 'Targeted research · Filling confidence gaps', 3)
    const extraResults = await exaSearch(`${name} ${domain} funding news site:techcrunch.com OR site:crunchbase.com`)
    for (const r of extraResults.slice(0, 2)) {
      if (r.highlights?.[0]) {
        addPoint('Exa (targeted)', 'Funding / News', r.highlights[0].slice(0, 200), 'High', r.url)
      }
    }
  }

  // Flag remaining gaps for research
  if (!contacts.some(c => c.email)) {
    addPoint('—', 'Email', 'Not found', 'Low', '', true, `→ Search apollo.io or hunter.io/${domain}`)
  }
  if (!co.funding) {
    addPoint('—', 'Funding Detail', 'Not found', 'Low', '', true, `→ Search crunchbase.com or techcrunch.com/"${name} funding"`)
  }

  // ── SCORING ────────────────────────────────────────────────────────────────
  onProgress('scoring', 'Gemini AI · 6-dimension scoring')

  const partial: Partial<CompanyResult> = {
    name, domain, industry,
    headcount: co.headcount || 'Unknown',
    funding: co.funding || 'Unknown',
    revenue: co.revenue || 'Unknown',
    description: co.description || '',
    inputData,
    contacts,
  }

  const score = await scoreCompany(partial, opts.product)

  return {
    id,
    input,
    name,
    domain,
    industry,
    headcount: co.headcount || 'Unknown',
    funding: co.funding || 'Unknown',
    revenue: co.revenue || 'Unknown',
    description: co.description || '',
    status: 'done',
    statusMessage: `${score.status} — ${score.total}/100`,
    iteration: 3,
    inputData,
    contacts,
    mainPhone: (co.phone as string | undefined) || contacts.find(c => c.phone)?.phone,
    score,
  }
}
