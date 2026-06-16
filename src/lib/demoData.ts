import type { CompanyResult } from './types'

export const DEMO_MODE_KEY = 'oie:demoMode:v1'

export const DEMO_RESULTS: CompanyResult[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Company 1: Elevate ENT Partners — Score 96, CALL NOW
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-elevate-ent',
    input: 'Elevate ENT Partners',
    name: 'Elevate ENT Partners',
    domain: 'elevateent.com',
    industry: 'ENT / Specialty MSO',
    headcount: '170+ physicians',
    funding: 'PE-backed by Audax Private Equity (2022)',
    revenue: '',
    location: 'Texas, Florida, Louisiana',
    peBacker: 'Audax Private Equity',
    numLocations: '110+ locations across TX, FL, LA',
    emrSystem: 'Mixed EMRs (acquired practices)',
    specialties: 'ENT, Audiology, Allergy',
    recentNews: 'Acquired Camellia ENT (June 2025); expanding into Louisiana and Tennessee',
    description:
      'PE-backed MSO (Audax) of independent ENT practices. Centralizes back-office functions across 110+ locations and 170+ physicians. Actively acquiring — each deal brings its own phones, fax lines, and scheduling setup.',
    status: 'done',
    statusMessage: 'Analysis complete',
    iteration: 1,
    mainPhone: '(512) 555-0100',
    inputData: [
      {
        id: 1,
        source: 'elevateent.com',
        type: 'Pain Point',
        value:
          'Each acquired ENT practice arrives with its own phone system, fax setup, and EMR quirks — front-office integration is where cost and patient leakage hide.',
        confidence: 'High',
        url: 'https://elevateent.com/about-us',
        gap: false,
      },
      {
        id: 2,
        source: 'BusinessWire',
        type: 'Pain Point',
        value:
          'Active acquisition pace (Camellia ENT, June 2025) creates recurring front-office standardization challenges across three states.',
        confidence: 'High',
        url: 'https://www.businesswire.com/news/home/camellia-ent',
        gap: false,
      },
      {
        id: 3,
        source: 'elevateent.com',
        type: 'Pain Point',
        value:
          'Named VP of Integration and Transformation (Corie Opdyke) — her role is exactly the front-office chaos Valerie automates.',
        confidence: 'High',
        url: 'https://elevateent.com/about-us',
        gap: false,
      },
    ],
    contacts: [
      {
        name: 'Amy Verlsteffen',
        title: 'VP of Operations (FL) / VP Patient Access',
        phone: '(813) 555-0142',
        email: 'averlsteffen@elevateent.com',
        linkedin: 'https://linkedin.com/in/amy-verlsteffen',
        score: 72,
        angle: 'Patient Access / Contact Center',
        hook: 'Owns scheduling and contact centers across FL and TX — the exact workflows Valerie automates.',
        whyThis:
          '#1 lead: role maps 1:1 to the product, bio says she\'s building the contact center strategy in each region now. Live trigger.',
      },
      {
        name: 'Michael Amerstein',
        title: 'Chief Operating Officer',
        phone: '(832) 555-0167',
        email: 'mamerstein@elevateent.com',
        linkedin: 'https://linkedin.com/in/michael-amerstein',
        score: 71,
        angle: 'COO / Operations',
        hook: 'Ex-COO of Axia Women\'s Health, scaled multi-site operations. Owns front-office standardization across 110 locations.',
        whyThis: 'Executive sponsor. Angle: standardizing front office as you acquire.',
      },
      {
        name: 'Corie Opdyke',
        title: 'VP of Integration and Transformation',
        phone: '(832) 555-0193',
        email: 'copdyke@elevateent.com',
        linkedin: 'https://linkedin.com/in/corie-opdyke',
        score: 70,
        angle: 'Operations / Standardization',
        hook: 'Owns integration of newly acquired practices — sees every broken front-office process the moment a practice joins.',
        whyThis: 'Champion. Active acquisitions keep this perpetually urgent.',
      },
      {
        name: 'Sylvain Foster',
        title: 'Chief Financial Officer',
        phone: '(832) 555-0181',
        email: 'sfoster@elevateent.com',
        linkedin: 'https://linkedin.com/in/sylvain-foster',
        score: 64,
        angle: 'CFO / Revenue Cycle',
        hook: 'Scope includes revenue cycle and procurement. Economic buyer feeling labor cost scale with locations.',
        whyThis:
          'Thread 4 (economic). Angle: fax and referral automation in revenue cycle, predictable savings.',
      },
      {
        name: 'Cliff Hogan',
        title: 'Chief Information Officer',
        phone: '(832) 555-0175',
        email: 'chogan@elevateent.com',
        linkedin: 'https://linkedin.com/in/cliff-hogan',
        score: 58,
        angle: 'CIO / IT',
        hook: 'Previously scaled IT across multi-state dental and OBGYN groups. Technical gatekeeper who can block or enable.',
        whyThis:
          'Validation, not entry. Angle: layers on top of existing EMRs without rip-and-replace.',
      },
    ],
    score: {
      total: 96,
      status: 'CALL NOW',
      sourceCount: 8,
      sources: [
        'elevateent.com',
        'businesswire.com',
        'audaxprivateequity.com',
        'pitchbook.com',
        'bassberry.com',
        'privsource.com',
        'beckers.com',
        'crunchbase.com',
      ],
      dimensions: [
        {
          name: 'ICP Fit',
          maxScore: 30,
          score: 29,
          evidence:
            'PE-backed (Audax) ENT MSO. Single decision-making entity centralizing back-office. Not a hospital or health system. Textbook ICP match.',
          confidence: 'High',
          sourceUrl: 'https://elevateent.com/about-us',
          evidenceVerified: true,
        },
        {
          name: 'Workflow Pain',
          maxScore: 20,
          score: 18,
          evidence:
            'ENT specialty runs on referrals, faxed records/prior auths, and high inbound call volume (scheduling, audiology, follow-up). Maps directly to Valerie\'s three products: fax automation, referral automation, call center automation.',
          confidence: 'High',
          sourceUrl: 'https://elevateent.com',
          evidenceVerified: true,
        },
        {
          name: 'Scale/Complexity',
          maxScore: 15,
          score: 14,
          evidence:
            '110+ locations, 170+ physicians across TX, FL, LA. Mixed EMRs from acquisitions. Active M&A creates recurring standardization complexity.',
          confidence: 'Medium',
          sourceUrl: 'https://pitchbook.com',
          evidenceVerified: false,
        },
        {
          name: 'Buying Committee',
          maxScore: 15,
          score: 15,
          evidence:
            'Named buying committee verified from elevateent.com: COO (Amerstein), President (Rodriguez), CFO (Foster), CIO (Hogan), VP Patient Access (Verlsteffen), VP Integration (Opdyke). Every Valerie product maps to a named owner.',
          confidence: 'High',
          sourceUrl: 'https://elevateent.com/about-us',
          evidenceVerified: true,
        },
        {
          name: 'Growth Pressure',
          maxScore: 10,
          score: 10,
          evidence:
            'Multiple acquisitions through 2025-2026, expanding Louisiana and Tennessee. Each acquisition brings its own front-office chaos — recurring trigger.',
          confidence: 'High',
          sourceUrl: 'https://www.businesswire.com/news/home/camellia-ent',
          evidenceVerified: true,
        },
        {
          name: 'Messaging Fit',
          maxScore: 10,
          score: 10,
          evidence:
            'Clear first touch: Amy Verlsteffen (patient scheduling/contact centers FL+TX). Strong economic angle for CFO. Integration angle for CIO. No translation needed.',
          confidence: 'High',
          sourceUrl: 'https://elevateent.com/about-us',
          evidenceVerified: true,
        },
      ],
    },
    research: {
      sitesCrawled: 8,
      fundingFound: true,
      foundersFound: true,
      founderNames: ['Joshua Polfreman (CEO)', 'Liz Rodriguez (President)'],
      lastBlogTitle: 'Elevate ENT Partners Acquires Camellia ENT',
      lastBlogUrl: 'https://www.businesswire.com/news/home/camellia-ent',
      lastBlogDate: '2025-06-15',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Company 2: The US Oncology Network — Score 81, CALL NOW
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-us-oncology',
    input: 'The US Oncology Network',
    name: 'The US Oncology Network',
    domain: 'usoncology.com',
    industry: 'Oncology / Independent Practice Network',
    headcount: '2,500+ providers across 600+ sites',
    funding: 'Backed by McKesson Corporation (acquired FCS/Core Ventures)',
    revenue: '',
    location: '~31 states nationwide',
    peBacker: 'McKesson Corporation',
    numLocations: '600+ sites in ~31 states',
    emrSystem: 'iKnowMed / McKesson (via Ontada)',
    specialties: 'Medical Oncology, Hematology, Radiation Oncology',
    recentNews: 'McKesson/Ontada supply practice technology; 2,500+ providers across 600+ sites',
    description:
      'McKesson-backed network of independent community oncology practices. Enormous workflow pain (faxed records, prior auths, referral intake). Decision path is murky: McKesson central or practice-level — the key risk.',
    status: 'done',
    statusMessage: 'Analysis complete',
    iteration: 1,
    mainPhone: '(713) 555-0200',
    inputData: [
      {
        id: 1,
        source: 'usoncology.com',
        type: 'Pain Point',
        value:
          'Oncology drowns in faxed records, prior authorizations, and referral intake — high-volume, high-touch workflows that scale with every new practice.',
        confidence: 'High',
        url: 'https://www.usoncology.com',
        gap: false,
      },
      {
        id: 2,
        source: 'McKesson press',
        type: 'Pain Point',
        value:
          'McKesson/Ontada already supply practice technology and infrastructure — incumbency creates a build-vs-incumbent challenge for any new vendor.',
        confidence: 'Medium',
        url: 'https://www.mckesson.com/oncology',
        gap: false,
      },
      {
        id: 3,
        source: 'VMG Health',
        type: 'Pain Point',
        value:
          '2,500+ providers across 600+ sites in ~31 states, each practice independently managed — creates distributed buying challenge.',
        confidence: 'Medium',
        url: 'https://vmghealth.com',
        gap: false,
      },
    ],
    contacts: [
      {
        name: 'Network Development Lead (needs verification)',
        title: 'VP of Network Development',
        phone: '(713) 555-0234',
        email: 'networkdev@usoncology.com',
        linkedin: 'https://linkedin.com/company/us-oncology-network',
        score: 55,
        angle: 'Network Growth',
        hook: 'Entry point for independent practice onboarding and integration questions.',
        whyThis:
          'Redirect to a single large affiliated practice (e.g., Texas Oncology) rather than pursuing the network centrally.',
      },
      {
        name: 'Practice Operations (needs verification)',
        title: 'VP of Practice Operations',
        phone: '(713) 555-0215',
        email: 'operations@usoncology.com',
        score: 48,
        angle: 'Operations',
        hook: 'Practice-level operations ownership — workflow pain is felt here.',
        whyThis: 'Pursue as a test account before scaling to network level.',
      },
    ],
    score: {
      total: 81,
      status: 'CALL NOW',
      sourceCount: 6,
      sources: [
        'usoncology.com',
        'mckesson.com',
        'vmghealth.com',
        'crunchbase.com',
        'pitchbook.com',
        'beckers.com',
      ],
      dimensions: [
        {
          name: 'ICP Fit',
          maxScore: 30,
          score: 24,
          evidence:
            'McKesson-backed network of independent community practices. Not a hospital system. ICP-valid but decision path is murky — McKesson central vs. practice-level.',
          confidence: 'High',
          sourceUrl: 'https://www.usoncology.com',
          evidenceVerified: true,
        },
        {
          name: 'Workflow Pain',
          maxScore: 20,
          score: 19,
          evidence:
            'Oncology has the highest fax/prior-auth/referral volume of any specialty. Classic Valerie pain profile.',
          confidence: 'High',
          sourceUrl: 'https://www.usoncology.com',
          evidenceVerified: true,
        },
        {
          name: 'Scale/Complexity',
          maxScore: 15,
          score: 15,
          evidence:
            '2,500+ providers, 600+ sites, ~31 states. Maximum scale and complexity.',
          confidence: 'Medium',
          sourceUrl: 'https://vmghealth.com',
          evidenceVerified: false,
        },
        {
          name: 'Buying Committee',
          maxScore: 15,
          score: 7,
          evidence:
            'Decision sits with McKesson centrally OR each independent practice — no single named owner for front-office workflow. McKesson/Ontada incumbency is a real blocker.',
          confidence: 'High',
          sourceUrl: 'https://www.mckesson.com',
          evidenceVerified: true,
        },
        {
          name: 'Growth Pressure',
          maxScore: 10,
          score: 9,
          evidence:
            'Active network expansion, FCS/Core Ventures acquisition. Growing affiliate base.',
          confidence: 'Medium',
          sourceUrl: 'https://www.mckesson.com/oncology',
          evidenceVerified: false,
        },
        {
          name: 'Messaging Fit',
          maxScore: 10,
          score: 7,
          evidence:
            'Best approach: target a single large affiliated practice (Texas Oncology) not the network. Re-target after a practice win.',
          confidence: 'Medium',
          sourceUrl: 'https://vmghealth.com',
          evidenceVerified: false,
        },
      ],
    },
    research: {
      sitesCrawled: 6,
      fundingFound: true,
      foundersFound: false,
      lastBlogTitle: 'McKesson Reports Oncology Network Growth Q2 2025',
      lastBlogUrl: 'https://www.mckesson.com/oncology',
      lastBlogDate: '2025-04-10',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Company 3: Growth Orthopedics — Score 70, SEQUENCE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-growth-ortho',
    input: 'Growth Orthopedics',
    name: 'Growth Orthopedics',
    domain: 'growthorthopedics.com',
    industry: 'Orthopedics / MSO',
    headcount: '8 practices, ~120 physicians',
    funding: 'PE-backed by Trivest Partners',
    revenue: '',
    location: 'Kentucky, Texas (Bluegrass Orthopaedics KY; Orthopaedic Specialists of Austin TX)',
    peBacker: 'Trivest Partners',
    numLocations: '8 practices in KY and TX',
    emrSystem: 'Practice-specific (decentralized)',
    specialties: 'Orthopedics, Sports Medicine, Physical Therapy',
    recentNews: 'Peter McCann (CEO) focused on independent practice federation model',
    description:
      'PE-backed (Trivest) MSO of independent orthopedic practices. Clean ICP type but explicitly decentralizes front and back office — no central buyer controls workflow. Pursue last; best angle if/when model changes.',
    status: 'done',
    statusMessage: 'Analysis complete',
    iteration: 1,
    mainPhone: '(859) 555-0300',
    inputData: [
      {
        id: 1,
        source: 'growthorthopedics.com',
        type: 'Pain Point',
        value:
          'Orthopedic practices run on referrals and scheduling, with high physical therapy follow-up volume — real Valerie pain profile.',
        confidence: 'High',
        url: 'https://www.growthorthopedics.com',
        gap: false,
      },
      {
        id: 2,
        source: "Becker's Spine Review",
        type: 'Pain Point',
        value:
          "Stated model is to leave practices 'fully independent in the front and back office' — works against centralized workflow automation.",
        confidence: 'High',
        url: 'https://www.beckersspine.com',
        gap: false,
      },
    ],
    contacts: [
      {
        name: 'Peter McCann',
        title: 'Chief Executive Officer',
        phone: '(859) 555-0312',
        email: 'pmccann@growthorthopedics.com',
        linkedin: 'https://linkedin.com/in/peter-mccann-ortho',
        score: 52,
        angle: 'CEO / President',
        hook: 'Builder of the federation model — would need to centralize front-office to use Valerie.',
        whyThis: 'Entry if Growth Ortho ever centralizes. Current model explicitly decentralized.',
      },
      {
        name: 'Operations Lead (needs verification)',
        title: 'VP of Practice Operations',
        phone: '(859) 555-0331',
        score: 44,
        angle: 'Operations',
        hook: 'Practice operations — if anyone is feeling the scheduling/referral pain, it\'s here.',
        whyThis: "Bottoms-up approach if CEO entry doesn't work.",
      },
    ],
    score: {
      total: 70,
      status: 'SEQUENCE',
      sourceCount: 4,
      sources: [
        'growthorthopedics.com',
        'beckersspine.com',
        'mcguirewoods.com',
        'privateequityinfo.com',
      ],
      dimensions: [
        {
          name: 'ICP Fit',
          maxScore: 30,
          score: 27,
          evidence:
            'PE-backed (Trivest) MSO of independent orthopedic practices. Clean ICP type.',
          confidence: 'High',
          sourceUrl: 'https://www.growthorthopedics.com',
          evidenceVerified: true,
        },
        {
          name: 'Workflow Pain',
          maxScore: 20,
          score: 13,
          evidence:
            "Ortho runs on referrals and scheduling but model is explicitly 'fully independent' front and back office — no central workflow to automate.",
          confidence: 'Medium',
          sourceUrl: 'https://www.beckersspine.com',
          evidenceVerified: false,
        },
        {
          name: 'Scale/Complexity',
          maxScore: 15,
          score: 8,
          evidence:
            'Small — handful of practices in KY and TX. Not enough scale to create urgent platform pain.',
          confidence: 'High',
          sourceUrl: 'https://www.growthorthopedics.com',
          evidenceVerified: true,
        },
        {
          name: 'Buying Committee',
          maxScore: 15,
          score: 8,
          evidence:
            'No central buyer for front-office workflow. Decentralized by design. CEO would need to change model first.',
          confidence: 'Medium',
          sourceUrl: 'https://www.beckersspine.com',
          evidenceVerified: false,
        },
        {
          name: 'Growth Pressure',
          maxScore: 10,
          score: 7,
          evidence:
            'Some acquisition activity but slower pace than Elevate ENT.',
          confidence: 'Medium',
          sourceUrl: 'https://www.growthorthopedics.com',
          evidenceVerified: false,
        },
        {
          name: 'Messaging Fit',
          maxScore: 10,
          score: 7,
          evidence:
            'Messaging exists but landing it requires a model shift. De-prioritize until they centralize.',
          confidence: 'Medium',
          sourceUrl: 'https://www.growthorthopedics.com',
          evidenceVerified: false,
        },
      ],
    },
    research: {
      sitesCrawled: 4,
      fundingFound: true,
      foundersFound: true,
      founderNames: ['Peter McCann (CEO)'],
      lastBlogTitle: 'Growth Orthopedics Expands Texas Footprint',
      lastBlogUrl: 'https://www.growthorthopedics.com/news',
      lastBlogDate: '2025-03-20',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Company 4: Baylor Scott & White Health — Score 0, DISQUALIFIED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-bsw-health',
    input: 'Baylor Scott & White Health',
    name: 'Baylor Scott & White Health',
    domain: 'bswhealth.com',
    industry: 'Health System / Hospital Network',
    headcount: '50,000+ employees, 50+ hospitals',
    funding: 'Nonprofit health system (no PE)',
    revenue: '',
    location: 'Texas',
    description:
      '50+ hospital nonprofit health system. Violates Valerie\'s hard ICP rule: Valerie does not partner with hospitals or health systems regardless of size. Disqualified before scoring begins.',
    status: 'done',
    statusMessage: 'Disqualified — hospital health system',
    iteration: 1,
    inputData: [
      {
        id: 1,
        source: 'BSWHealth.com',
        type: 'DQ Signal',
        value:
          '50+ hospital nonprofit health system. Violates hard ICP filter — Valerie does not partner with hospitals or health systems.',
        confidence: 'High',
        url: 'https://www.bswhealth.com',
        gap: false,
      },
    ],
    contacts: [],
    score: {
      total: 0,
      status: 'DISQUALIFIED',
      sourceCount: 3,
      sources: ['bswhealth.com', 'guidestar.org', 'wikipedia.org'],
      dimensions: [
        {
          name: 'ICP Fit',
          maxScore: 30,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Workflow Pain',
          maxScore: 20,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Scale/Complexity',
          maxScore: 15,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Buying Committee',
          maxScore: 15,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Growth Pressure',
          maxScore: 10,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Messaging Fit',
          maxScore: 10,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
      ],
    },
    research: {
      sitesCrawled: 3,
      fundingFound: false,
      foundersFound: false,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Company 5: Sutter Health — Score 0, DISQUALIFIED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'demo-sutter-health',
    input: 'Sutter Health',
    name: 'Sutter Health',
    domain: 'sutterhealth.org',
    industry: 'Health System / Hospital Network',
    headcount: '24,000+ employees, 24-27 hospitals',
    funding: 'Nonprofit health system',
    revenue: '',
    location: 'Northern California',
    description:
      '24-27 hospital nonprofit health system. Same hard ICP disqualification as Baylor Scott & White — hospital systems are excluded regardless of size or geographic fit.',
    status: 'done',
    statusMessage: 'Disqualified — hospital health system',
    iteration: 1,
    inputData: [
      {
        id: 1,
        source: 'SutterHealth.org',
        type: 'DQ Signal',
        value:
          '24-27 hospital nonprofit health system. Same hard disqualification as Baylor Scott & White — Valerie does not partner with hospitals or health systems.',
        confidence: 'High',
        url: 'https://www.sutterhealth.org',
        gap: false,
      },
    ],
    contacts: [],
    score: {
      total: 0,
      status: 'DISQUALIFIED',
      sourceCount: 3,
      sources: ['sutterhealth.org', 'ama-assn.org', 'wikipedia.org'],
      dimensions: [
        {
          name: 'ICP Fit',
          maxScore: 30,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Workflow Pain',
          maxScore: 20,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Scale/Complexity',
          maxScore: 15,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Buying Committee',
          maxScore: 15,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Growth Pressure',
          maxScore: 10,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
        {
          name: 'Messaging Fit',
          maxScore: 10,
          score: 0,
          evidence:
            'DISQUALIFIED: Nonprofit hospital health system. Valerie\'s hard ICP filter eliminates hospitals and health systems before scoring.',
          confidence: 'High',
          evidenceVerified: true,
        },
      ],
    },
    research: {
      sitesCrawled: 3,
      fundingFound: false,
      foundersFound: false,
    },
  },
]
