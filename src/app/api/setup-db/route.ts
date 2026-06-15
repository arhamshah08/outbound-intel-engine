import { createClient } from '@supabase/supabase-js'

const PROJECT_REF = 'vlhdbvxvehztfilonevj'

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS prospects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL, domain text, industry text, headcount text, funding text,
  description text, score integer DEFAULT 0, score_status text DEFAULT 'DEPRIORITIZE',
  score_dimensions jsonb DEFAULT '[]', approach text[] DEFAULT '{}', status text DEFAULT 'active',
  contacts jsonb DEFAULT '[]', pain_points jsonb DEFAULT '[]', notes text DEFAULT '',
  campaign_name text DEFAULT '', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  type text NOT NULL, contact_name text, contact_title text, outcome text, notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS playbooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  contact_name text NOT NULL, contact_title text,
  openers jsonb DEFAULT '[]', if_yes_branches jsonb DEFAULT '[]', if_no_branches jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS faqs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  contact_name text NOT NULL, question text NOT NULL, answer text, category text DEFAULT 'general',
  worked boolean, times_used integer DEFAULT 0, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reinforcement_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  contact_name text, contact_title text, item_type text, item_ref_id uuid,
  item_text text, outcome text, context text, created_at timestamptz DEFAULT now()
);
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prospects' AND policyname='allow_all') THEN
    CREATE POLICY "allow_all" ON prospects FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activities' AND policyname='allow_all') THEN
    CREATE POLICY "allow_all" ON activities FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='playbooks' AND policyname='allow_all') THEN
    CREATE POLICY "allow_all" ON playbooks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='allow_all') THEN
    CREATE POLICY "allow_all" ON faqs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reinforcement_log' AND policyname='allow_all') THEN
    CREATE POLICY "allow_all" ON reinforcement_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`

// Check if tables already exist using the anon key
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { error } = await supabase.from('prospects').select('id').limit(1)
  return Response.json({ tablesExist: !error, error: error?.message })
}

// Try to create tables via Supabase Management API (needs a personal access token)
export async function POST(req: Request) {
  const { accessToken } = await req.json()

  if (!accessToken?.trim()) {
    return Response.json({ ok: false, error: 'Access token is required' }, { status: 400 })
  }

  // Supabase Management API — runs SQL with full privileges
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken.trim()}`,
    },
    body: JSON.stringify({ query: MIGRATION_SQL }),
  })

  if (res.ok) {
    return Response.json({ ok: true, message: 'All 5 tables created successfully!' })
  }

  const body = await res.json().catch(() => ({ message: res.statusText }))

  // If 401, token is wrong type
  if (res.status === 401) {
    return Response.json({
      ok: false,
      error: 'Invalid token. Make sure you\'re using a Supabase Personal Access Token (from account settings), not a project API key.',
    }, { status: 400 })
  }

  return Response.json({
    ok: false,
    error: body?.message ?? `API returned ${res.status}`,
  }, { status: 500 })
}
