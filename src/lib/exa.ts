const EXA_KEY = process.env.EXA_API_KEY!
const BASE = 'https://api.exa.ai'

interface ExaResult {
  url: string
  title: string
  highlights?: string[]
  text?: string
}

interface ExaResponse {
  results: ExaResult[]
  output?: { content: Record<string, unknown>; grounding: unknown[] }
}

async function exaPost(endpoint: string, body: object): Promise<ExaResponse> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'x-api-key': EXA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Exa ${endpoint} failed: ${res.status}`)
  return res.json()
}

export async function exaSearch(query: string, numResults = 5): Promise<ExaResult[]> {
  const data = await exaPost('/search', {
    query,
    type: 'auto',
    numResults,
    contents: { highlights: true },
  })
  return data.results
}

export async function exaDeep(query: string, systemPrompt: string, schema: object): Promise<{ structured: Record<string, unknown>; results: ExaResult[] }> {
  const data = await exaPost('/search', {
    query,
    type: 'deep',
    numResults: 5,
    systemPrompt,
    outputSchema: schema,
    contents: { highlights: true },
  })
  return {
    structured: (data.output?.content ?? {}) as Record<string, unknown>,
    results: data.results,
  }
}

export async function exaContents(urls: string[]): Promise<ExaResult[]> {
  if (!urls.length) return []
  const res = await fetch(`${BASE}/contents`, {
    method: 'POST',
    headers: { 'x-api-key': EXA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, highlights: true }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

// Brave fallback — only runs if BRAVE_API_KEY is set
export async function braveSearch(query: string): Promise<ExaResult[]> {
  const key = process.env.BRAVE_API_KEY
  if (!key) return []
  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: { 'X-Subscription-Token': key, Accept: 'application/json' },
    })
    const data = await res.json()
    return (data.web?.results ?? []).map((r: { url: string; title: string; description: string }) => ({
      url: r.url,
      title: r.title,
      highlights: [r.description],
    }))
  } catch { return [] }
}

// Apollo fallback — finds contacts by domain
export async function apolloSearch(domain: string, title: string): Promise<{ name: string; title: string; email?: string; linkedin?: string }[]> {
  const key = process.env.APOLLO_API_KEY
  if (!key) return []
  try {
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
      body: JSON.stringify({
        api_key: key,
        q_organization_domains: domain,
        person_titles: [title],
        per_page: 5,
      }),
    })
    const data = await res.json()
    return (data.people ?? []).map((p: { name: string; title: string; email: string; linkedin_url: string; phone_numbers?: { sanitized_number: string }[] }) => ({
      name: p.name,
      title: p.title,
      email: p.email,
      phone: p.phone_numbers?.[0]?.sanitized_number,
      linkedin: p.linkedin_url,
    }))
  } catch { return [] }
}

// Firecrawl fallback — scrapes a URL for content
export async function firecrawlScrape(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  try {
    const res = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ url, pageOptions: { onlyMainContent: true } }),
    })
    const data = await res.json()
    return data.data?.markdown?.slice(0, 3000) ?? ''
  } catch { return '' }
}
