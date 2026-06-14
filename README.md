# OUTBOUND INTELLIGENCE ENGINE — ARCHITECTURE OVERVIEW
### *Turning Raw Company Lists into Scored, Personalized Outreach via Agentic Loops*

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 14 (App Router) + React 18 + Tailwind CSS | Single-page, no routing — all state managed in React. Lucide React for icons. Deployed on Vercel. |
| **Backend** | Next.js API Routes (Node.js serverless) | Two routes: `POST /api/enrich` streams results via SSE as each company completes. `PUT /api/enrich` generates call briefs on demand. Runs on Vercel Functions (300s timeout). |
| **Database / SQL** | None (stateless) — **Supabase recommended for v2** | Currently all results are computed on the fly and held in React state. To persist campaigns, save results, and share briefs via link → add Supabase (Postgres + RLS). Schema: `campaigns`, `companies`, `contacts`, `call_briefs`. |
| **AI / Scoring** | Google Gemini 2.0 Flash (primary) → OpenAI GPT-4o-mini (fallback) | Gemini scores all 6 dimensions and generates call briefs. OpenAI fires automatically if Gemini fails or if `OPENAI_API_KEY` is set and preferred. |
| **Primary Scraper** | Exa.ai | Handles company discovery, deep enrichment, pain point research, contact finding. Uses `auto` type for speed and `deep` type for synthesis + structured JSON output. |
| **Contact Enrichment** | Apollo.io (primary) → Exa fallback | Apollo finds contacts by domain + title and returns verified emails. If `APOLLO_API_KEY` is not set, Exa searches LinkedIn instead. |
| **Website Scraper** | Firecrawl (primary) → Exa `/contents` fallback | Deep scrapes company websites (homepage, /integrations, /careers). Falls back to Exa's `/contents` endpoint if Firecrawl key not set. |
| **Search Redundancy** | Brave Search API (optional) | Adds a third independent web search source for pain points and news. Fires in parallel with Exa when `BRAVE_API_KEY` is set. Prevents single-source misses. |
| **Orchestration** | Clay API (optional) | When `CLAY_API_KEY` is set, Clay's native enrichments (LinkedIn, Clearbit, etc.) run alongside our custom pipeline. Results merge into the same output tables. |
| **Deployment** | Vercel | Auto-deploys from `main` branch on GitHub push. Env vars managed via Vercel dashboard. |

### Environment Variables

```bash
# Required — app will not work without these
EXA_API_KEY=                      # exa.ai — primary scraper
GOOGLE_GENERATIVE_AI_API_KEY=     # Google AI Studio — scoring + briefs

# Optional — each adds a redundancy layer; app works fine without them
APOLLO_API_KEY=                   # apollo.io — contact emails (falls back to Exa)
FIRECRAWL_API_KEY=                # firecrawl.dev — website scraping (falls back to Exa)
OPENAI_API_KEY=                   # openai.com — AI fallback if Gemini fails
BRAVE_API_KEY=                    # brave.com/search/api — third search source
CLAY_API_KEY=                     # clay.com — native enrichments (LinkedIn, Clearbit)
```

### Recommended v2 Additions (Supabase)

```sql
-- campaigns: one row per analysis run
create table campaigns (
  id uuid default gen_random_uuid() primary key,
  name text,
  product text,
  target_title text,
  created_at timestamptz default now()
);

-- companies: enriched results per campaign
create table companies (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  name text, domain text, industry text,
  score numeric, status text,
  input_data jsonb, contacts jsonb,
  score_breakdown jsonb, call_brief jsonb,
  created_at timestamptz default now()
);
```

---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│   SOURCES (INBOUND)          CORE ENGINE                          OUTPUT (NORTHBOUND)       │
│                                                                                             │
│  ┌─────────────┐      ┌──────────────────────────────┐      ┌──────────────────────────┐   │
│  │ Exa.ai      │ ───► │     LAYER 1 — DISCOVERY      │      │  Clay Table              │   │
│  │ Web Search  │      │  Find · Validate · Classify  │      │  (scored + enriched)     │   │
│  └─────────────┘      └──────────────┬───────────────┘      └──────────────────────────┘   │
│                                      │                                                      │
│  ┌─────────────┐      ┌──────────────▼───────────────┐      ┌──────────────────────────┐   │
│  │ Clay MCP    │ ───► │    LAYER 2 — ENRICHMENT       │      │  Smartlead / Instantly   │   │
│  │ Company +   │      │  Company · Contacts · Funding │      │  (sequences, ready)      │   │
│  │ Contacts    │      └──────────────┬───────────────┘      └──────────────────────────┘   │
│  └─────────────┘                     │                                                      │
│                                      │◄──── FEEDBACK LOOP ────┐                            │
│  ┌─────────────┐      ┌──────────────▼───────────────┐        │                            │
│  │ Apollo API  │ ───► │   LAYER 3 — INTELLIGENCE     │   GAP  │                            │
│  │ Contacts +  │      │  Score · Gap-check · Re-query├────────┘                            │
│  │ Emails      │      └──────────────┬───────────────┘                                     │
│  └─────────────┘                     │                                                      │
│                                      │                                                      │
│  ┌─────────────┐      ┌──────────────▼───────────────┐      ┌──────────────────────────┐   │
│  │ Firecrawl   │ ───► │   LAYER 4 — PERSONALIZATION  │      │  HubSpot / Salesforce    │   │
│  │ Website     │      │  Pain notes · First line ·   │      │  (CRM sync)              │   │
│  │ Scraping    │      │  Call brief                  │      └──────────────────────────┘   │
│  └─────────────┘      └──────────────┬───────────────┘                                     │
│                                      │                                                      │
│  ┌─────────────┐      ┌──────────────▼───────────────┐      ┌──────────────────────────┐   │
│  │ Google AI   │ ───► │   LAYER 5 — OUTPUT           │      │  CSV Export              │   │
│  │ Gemini      │      │  Tables · Call notes ·       │      │  (manual review)         │   │
│  │ Scoring +   │      │  Research links              │      └──────────────────────────┘   │
│  │ Copy        │      └──────────────────────────────┘                                     │
│  └─────────────┘                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Edge-to-Output Data Flow

```
Collect ──► Normalize ──► Enrich ──► Score ──► Gap Check ──► Re-query ──► Personalize ──► Export
              │                          │           │              │
              │                          │     [confidence       [targeted
              │                          │      < 7.0]           Exa query]
              │                          │           │              │
              └──────────────────────────┴───────────┴──────────────┘
                                    FEEDBACK LOOP (max 3 iterations)
```

---

## Loop Logic

```
function enrichmentLoop(company, maxIterations = 3):

  for iteration in range(maxIterations):

    data   = scrape(company, depth = iteration)     # deeper each pass
    score  = scoreAllDimensions(data)
    gaps   = findGaps(score, confidenceThreshold = 7.0)

    if gaps.isEmpty():
      break                                          # done — all dimensions confident

    company.targetedQueries = buildQueries(gaps)     # feed gaps back as new searches
    iteration++

  return { inputTable, outcomeTable, callNotes, researchLinks }


Gap → Auto-Query Mapping:
  No email found      →  "[name] [company] email"  on apollo.io, hunter.io
  No funding data     →  "[company] funding round"  on techcrunch.com, crunchbase.com
  No tech stack       →  builtwith.com/[domain]  scrape
  No pain points      →  "[company] reviews challenges"  on glassdoor.com, reddit.com
  Low traffic signal  →  similarweb.com/[domain]  scrape
```

---

## Table 1 — INPUT (Raw Intelligence)
*Everything received from the web. Updated each loop iteration.*

| # | Source | Type | Value | Confidence | URL (Research Link) | Gap? | Loop Action |
|---|--------|------|-------|------------|---------------------|------|-------------|
| 1 | Clay MCP | Funding | $500K seed — YC S23 | High | ycombinator.com/companies/surface-labs | — | — |
| 2 | Clay MCP | Revenue | $500K–1M ARR | Medium | withsurface.com | Verify | → Scrape pricing page |
| 3 | Clay MCP | Headcount | 11 employees | High | linkedin.com/company/surface-labs | — | — |
| 4 | Clay MCP | Growth | 5 → 11 people in 3 months | High | linkedin.com/company/surface-labs | — | — |
| 5 | Exa auto | Buying Signal | Hired Head of GTM March 2026 | High | linkedin.com/in/shawn-young | — | — |
| 6 | Exa auto | Buying Signal | Posting for Founding SDR now | High | ycombinator.com/jobs/PtYDRvy | — | — |
| 7 | Exa auto | Pain Point | No outbound motion built yet | High | ycombinator.com/jobs/PtYDRvy | — | — |
| 8 | Exa auto | Pain Point | 30–50% of inbound leads wasted | High | ycombinator.com/launches/OQ6 | — | — |
| 9 | Exa auto | Traffic | 13,693 visits/month, +114% in 60d | High | withsurface.com (Exa entity data) | — | — |
| 10 | Exa auto | Investors | Garry Tan, Dharmesh Shah, AngelList CEO | High | ycombinator.com/companies/surface-labs | — | — |
| 11 | Firecrawl | Tech Stack | HubSpot, Salesforce integrations | Medium | withsurface.com/integrations | Partial | → Loop 2: scrape /integrations |
| 12 | Clay MCP | Key Contact | Shawn Young — Head of GTM | High | linkedin.com/in/shawn-young | — | — |
| 13 | Clay MCP | Key Contact | Saharsh Agrawal — CEO | High | linkedin.com/in/saharsh-agrawal | — | — |
| 14 | Apollo | Email — Shawn Young | Not found | Low | apollo.io | **GAP** | → Loop 2: Apollo lookup |
| 15 | Apollo | Email — Saharsh | saharsh@withsurface.com | High | ycombinator.com (public) | — | — |
| 16 | Exa deep | Tech Stack Detail | Built on Next.js, Vercel, Segment | Low | builtwith.com/withsurface.com | **GAP** | → Loop 3: BuiltWith scrape |
| 17 | Exa deep | Competitive | Competes with Chili Piper, LeanData | High | ycombinator.com/launches/OQ6 | — | — |

---

## Table 2 — OUTCOME (Score Card)
*What is being scored. Final output after all loop iterations complete.*

| Dimension | Weight | Score /10 | Weighted | Evidence | Confidence | Research More |
|-----------|--------|-----------|----------|----------|------------|---------------|
| ICP Fit — Industry | 20% | 9 | 1.80 | B2B SaaS, GTM / marketing ops | High | — |
| ICP Fit — Company Size | 10% | 8 | 0.80 | 11 people, post-YC, growing fast | High | — |
| Buying Signal Strength | 25% | 10 | 2.50 | Hiring SDR + new Head of GTM now | High | ycombinator.com/jobs/PtYDRvy |
| Budget Signal | 15% | 7 | 1.05 | $500K raised, $500K–1M revenue | Medium | crunchbase.com/surface-labs |
| Pain-to-Product Match | 20% | 9 | 1.80 | Building outbound from scratch | High | ycombinator.com/launches/OQ6 |
| Contact Quality | 10% | 6 | 0.60 | Name found, email missing (Shawn) | Low | apollo.io · hunter.io/withsurface.com |
| **TOTAL** | 100% | — | **8.55 / 10** | | | |

**Score threshold: 8.0 = CALL NOW · 6.0–7.9 = SEQUENCE · < 6.0 = DEPRIORITISE**

---

## Pre-Call Brief (auto-generated at score ≥ 8.0)

```
COMPANY:   Surface Labs — withsurface.com
CONTACT:   Shawn Young, Head of GTM (started March 2026 — 3 months in)
SCORE:     8.55 / 10 — CALL NOW

OPEN WITH:
  "Saw you just posted the Founding SDR role — looks like you're building the
   outbound motion from scratch. Wanted to share something relevant."

REFERENCE ON THE CALL:
  → SDR job posting      ycombinator.com/jobs/PtYDRvy-founding-gtm-sdr
  → Dharmesh Shah backed — signals marketing-first DNA
  → Traffic up 114% — inbound working, outbound is the gap

STILL MISSING (loop incomplete — check before calling):
  → Shawn Young email    → apollo.io or hunter.io/withsurface.com
  → Full tech stack      → builtwith.com/withsurface.com
  → Exact funding total  → crunchbase.com · techcrunch.com/"surface labs funding"

PERSONALISED FIRST LINE:
  [blocked — enter your product description to generate]
```

---

## Loop Trace — Full Example Run

### Iteration 1 — Broad (Exa `auto` + Clay)
```
Queries run:
  exa.auto  → "Surface Labs withsurface.com YC company"
  clay.mcp  → find-and-enrich-company(withsurface.com)
  clay.mcp  → find-and-enrich-contacts(withsurface.com, titles=[GTM, CEO, Sales])

Found:       17 data points
Gaps:        3 (email, tech stack detail, exact funding)
Confidence:  avg 6.8 — below threshold → LOOP AGAIN
```

### Iteration 2 — Targeted (Exa `deep` on gaps)
```
Queries run:
  exa.deep  → "Shawn Young Surface Labs email contact"
  exa.deep  → "withsurface.com tech stack integrations built with"
  apollo    → contact lookup (Shawn Young, withsurface.com)

Found:       Email partial match (saharsh confirmed, shawn still missing)
             Tech stack: Next.js, Vercel, HubSpot confirmed
Gaps:        1 (Shawn email)
Confidence:  avg 7.6 — approaching threshold → LOOP AGAIN
```

### Iteration 3 — Surgical (URL scrapes on specific pages)
```
Queries run:
  firecrawl → withsurface.com/integrations
  firecrawl → withsurface.com/blog/we-stopped-asking-leetcode
  exa.auto  → site:hunter.io "withsurface.com"

Found:       Shawn Young email pattern inferred (shawn@withsurface.com — unverified)
             Blog confirms hiring pain: wrote about ditching LeetCode — signal of fast team growth
Gaps:        0 confirmed gaps above threshold
Confidence:  avg 8.2 — EXIT LOOP
```

### Final Output
```
Iterations:    3
Total queries: 9 (3 per iteration)
Exa cost:      ~$0.09 (9 × $0.01)
Time:          ~25 seconds
Score:         8.55 / 10 → CALL NOW
```

---

## Key Benefits

| | | | | | |
|---|---|---|---|---|---|
| **Agentic Loop** | **Sourced Notes** | **Two-Table Output** | **Call-Ready Brief** | **Any ICP** | **$50 Budget** |
| Self-corrects on low-confidence gaps | Every pain point has a URL | Raw intel + scored outcome separated | Pre-call notes auto-generated at 8.0+ | Works for any product or persona | Exa + Clay free tiers cover 500 contacts |

---

*Built with: Clay MCP · Exa.ai · Apollo · Firecrawl · Google Gemini*
*Architecture by Arham Shah · 2026*
