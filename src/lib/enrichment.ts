import { exaSearch, exaDeep, apolloSearch, braveSearch } from './exa'
import { scoreCompany, generateBrief, scoreContacts } from './ai'
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
    pe_backer:      { type: 'string', description: 'Private equity firm or investor backing this company, if any (e.g. "KKR", "Warburg Pincus")' },
    num_locations:  { type: 'string', description: 'Number of offices, clinics, or practice sites (e.g. "12 sites", "8 locations across 3 states")' },
    emr_system:     { type: 'string', description: 'Electronic Medical Record system they use (e.g. "Epic", "Athena", "eClinicalWorks", "Modernizing Medicine")' },
    specialties:    { type: 'string', description: 'Medical specialties offered (e.g. "Orthopedics, Sports Medicine, Physical Therapy")' },
    recent_news:    { type: 'string', description: 'Most recent notable event: acquisition, expansion, funding, new exec hire, or product launch in 2024-2025' },
    location: { type: 'string', description: 'City and state (or city and country) of company headquarters, e.g. "Austin, TX" or "Chicago, IL"' },
  },
  required: ['name', 'domain', 'industry'],
}

const LEADERSHIP_SCHEMA = {
  type: 'object',
  properties: {
    exec_1_name: { type: 'string', description: 'Full name of executive 1' },
    exec_1_title: { type: 'string', description: 'Exact title of executive 1' },
    exec_1_context: { type: 'string', description: 'What executive 1 owns or their background' },
    exec_2_name: { type: 'string', description: 'Full name of executive 2' },
    exec_2_title: { type: 'string', description: 'Exact title of executive 2' },
    exec_2_context: { type: 'string', description: 'What executive 2 owns or their background' },
    exec_3_name: { type: 'string', description: 'Full name of executive 3' },
    exec_3_title: { type: 'string', description: 'Exact title of executive 3' },
    exec_3_context: { type: 'string', description: 'What executive 3 owns or their background' },
    exec_4_name: { type: 'string', description: 'Full name of executive 4' },
    exec_4_title: { type: 'string', description: 'Exact title of executive 4' },
    exec_4_context: { type: 'string', description: 'What executive 4 owns or their background' },
    exec_5_name: { type: 'string', description: 'Full name of executive 5' },
    exec_5_title: { type: 'string', description: 'Exact title of executive 5' },
    exec_5_context: { type: 'string', description: 'What executive 5 owns or their background' },
    exec_6_name: { type: 'string', description: 'Full name of executive 6' },
    exec_6_title: { type: 'string', description: 'Exact title of executive 6' },
    exec_6_context: { type: 'string', description: 'What executive 6 owns or their background' },
  },
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

type OnProgress = (step: string, message: string, iteration?: number, snippet?: string) => void

export async function enrichCompany(
  input: string,
  opts: { product: string; domain?: string; tags?: string[] },
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

  const [discoveryResults, painResults, leadershipResults] = await Promise.all([
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

    exaDeep(
      `${input} ${opts.domain ?? ''} leadership team executives management about us COO CFO CIO VP Operations`,
      'Extract named executives from the company leadership or about page. Find COO, CFO, VP Operations, CIO, CMO and other senior leaders with their exact titles and what they own.',
      LEADERSHIP_SCHEMA,
    ).catch(() => ({ structured: {}, results: [] })),
  ])

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
  if (co.pe_backer)     addPoint('Exa (deep)', 'PE Backer', co.pe_backer, 'High', discoveryResults.results[0]?.url ?? '')
  if (co.num_locations) addPoint('Exa (deep)', 'Locations', co.num_locations, 'Medium', discoveryResults.results[0]?.url ?? '')
  if (co.emr_system)    addPoint('Exa (deep)', 'EMR System', co.emr_system, 'Medium', discoveryResults.results[0]?.url ?? '')
  if (co.specialties)   addPoint('Exa (deep)', 'Specialties', co.specialties, 'High', discoveryResults.results[0]?.url ?? '')
  if (co.recent_news)   addPoint('Exa (deep)', 'Recent News', co.recent_news, 'High', discoveryResults.results[0]?.url ?? '')
  if (co.location) addPoint('Exa (deep)', 'Location', co.location, 'High', discoveryResults.results[0]?.url ?? '')

  // Add pain points
  if (pn.pain_1) addPoint('Exa (deep)', 'Pain Point', pn.pain_1, 'High', pn.pain_1_url ?? painResults.results[0]?.url ?? '')
  if (pn.pain_2) addPoint('Exa (deep)', 'Pain Point', pn.pain_2, 'Medium', pn.pain_2_url ?? painResults.results[1]?.url ?? '')
  if (pn.pain_3) addPoint('Exa (deep)', 'Pain Point', pn.pain_3, 'Medium', pn.pain_3_url ?? painResults.results[2]?.url ?? '')
  if (pn.growth_signal) addPoint('Exa (deep)', 'Buying Signal', pn.growth_signal, 'High', pn.growth_signal_url ?? '')

  // Extract named executives from leadership page
  const ldr = leadershipResults.structured as Record<string, string>
  const rawExecs: Contact[] = []
  for (let i = 1; i <= 6; i++) {
    const execName = ldr[`exec_${i}_name`]
    const execTitle = ldr[`exec_${i}_title`]
    if (!execName) break
    rawExecs.push({ name: execName, title: execTitle || 'Executive', whyThis: ldr[`exec_${i}_context`] || undefined })
    addPoint('Exa (deep)', 'Contact', `${execName} — ${execTitle}`, 'High', leadershipResults.results[0]?.url ?? '')
  }
  contacts.push(...rawExecs)

  // Emit enrich snapshot — what we found
  const enrichSnippet = [
    co.description ? co.description.slice(0, 80) : null,
    co.funding ? `Funding: ${co.funding}` : null,
    co.headcount ? `Headcount: ${co.headcount}` : null,
    pn.pain_1 ? `Pain: ${pn.pain_1.slice(0, 70)}` : null,
  ].filter(Boolean).join(' · ')
  onProgress('enrich', 'Signals extracted · Processing intelligence', 1, enrichSnippet || undefined)

  // ── LINKEDIN LOOKUP: parallel search per executive ────────────────────────
  if (rawExecs.length) {
    onProgress('contacts', `Finding LinkedIn profiles for ${rawExecs.length} decision-makers`, 2,
      rawExecs.map(e => `${e.name} (${e.title})`).join(', '))
    const linkedinSearches = await Promise.all(
      rawExecs.map(exec =>
        exaSearch(`"${exec.name}" ${name} site:linkedin.com/in`, 1).catch(() => [])
      )
    )
    linkedinSearches.forEach((results, i) => {
      const url = results[0]?.url
      if (url?.includes('linkedin.com/in/')) contacts[i].linkedin = url
    })
    const found = contacts.filter(c => c.linkedin).length
    onProgress('contacts', `${found}/${rawExecs.length} LinkedIn profiles found`, 2,
      contacts.filter(c => c.linkedin).map(c => c.name).join(', ') || undefined)
  }

  // ── ITERATION 2: Gap filling ───────────────────────────────────────────────
  const hasEmail = contacts.some(c => c.email)
  const hasPainPoints = inputData.filter(d => d.type === 'Pain Point').length >= 2

  if (!hasEmail || !hasPainPoints) {
    const contactSnippet = contacts.length > 0
      ? contacts.map(c => `${c.name} (${c.title})`).join(', ')
      : 'Searching Apollo + LinkedIn...'
    onProgress('contacts', 'Finding decision-makers via Apollo + LinkedIn', 2, contactSnippet)

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
    onProgress('deep-dive', 'Targeted research · Filling confidence gaps', 3,
      `Researching ${lowConfidence.length} low-confidence signal(s)`)
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
  const scoringSnippet = [
    `${inputData.length} data points collected`,
    contacts.length > 0 ? `${contacts.length} contact(s): ${contacts[0].name}` : 'No contacts found',
    inputData.filter(d => d.type === 'Pain Point').length > 0
      ? `${inputData.filter(d => d.type === 'Pain Point').length} pain triggers`
      : null,
  ].filter(Boolean).join(' · ')
  onProgress('scoring', 'Gemini AI · 6-dimension scoring', undefined, scoringSnippet)

  const partial: Partial<CompanyResult> = {
    name, domain, industry,
    headcount: co.headcount || 'Unknown',
    funding: co.funding || 'Unknown',
    revenue: co.revenue || 'Unknown',
    location: (co.location as string | undefined) || '',
    peBacker:      (co.pe_backer as string | undefined) || '',
    numLocations:  (co.num_locations as string | undefined) || '',
    emrSystem:     (co.emr_system as string | undefined) || '',
    specialties:   (co.specialties as string | undefined) || '',
    recentNews:    (co.recent_news as string | undefined) || '',
    description: co.description || '',
    inputData,
    contacts,
  }

  // Count distinct source URLs feeding the score — used for the visibility badge
  // and the INSUFFICIENT threshold (< 3 sources = not enough to score honestly).
  const distinctSources = Array.from(
    new Set(inputData.map(d => d.url).filter((u): u is string => Boolean(u && u.length > 0))),
  )
  partial.inputData = inputData

  // Track fields enrichment couldn't find. UI will surface inline inputs asking
  // the user to fill these in instead of silently guessing or scoring 0.
  const missingFields: { field: string; label: string }[] = []
  if (!opts.domain && !co.domain) missingFields.push({ field: 'domain', label: 'Company website (we couldn\'t find it)' })
  if (!co.funding) missingFields.push({ field: 'funding', label: 'Funding stage or amount' })
  if (!co.headcount) missingFields.push({ field: 'headcount', label: 'Employee count' })
  if (contacts.length === 0) missingFields.push({ field: 'contacts', label: 'A decision-maker name or LinkedIn URL' })

  const [rawScore, enrichedContacts] = await Promise.all([
    scoreCompany(partial, opts.product, opts.tags),
    scoreContacts(contacts, partial, opts.product),
  ])

  // Apply source-count visibility: attach the count to the score, and downgrade
  // to INSUFFICIENT if we found fewer than 3 distinct sources backing it.
  const MIN_SOURCES = 3
  const score = {
    ...rawScore,
    sourceCount: distinctSources.length,
    sources: distinctSources,
    status:
      rawScore.status === 'DISQUALIFIED' || rawScore.status === 'INSUFFICIENT'
        ? rawScore.status
        : distinctSources.length < MIN_SOURCES
          ? ('INSUFFICIENT' as const)
          : rawScore.status,
  }

  return {
    id,
    input,
    name,
    domain,
    industry,
    headcount: co.headcount || 'Unknown',
    funding: co.funding || 'Unknown',
    revenue: co.revenue || 'Unknown',
    location: (co.location as string | undefined) || '',
    peBacker:      (co.pe_backer as string | undefined) || '',
    numLocations:  (co.num_locations as string | undefined) || '',
    emrSystem:     (co.emr_system as string | undefined) || '',
    specialties:   (co.specialties as string | undefined) || '',
    recentNews:    (co.recent_news as string | undefined) || '',
    description: co.description || '',
    status: 'done',
    statusMessage:
      score.status === 'INSUFFICIENT'
        ? `INSUFFICIENT — ${distinctSources.length} sources`
        : `${score.status} — ${score.total}/100`,
    iteration: 3,
    inputData,
    contacts: enrichedContacts,
    mainPhone: (co.phone as string | undefined) || enrichedContacts.find(c => c.phone)?.phone,
    score,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  }
}
