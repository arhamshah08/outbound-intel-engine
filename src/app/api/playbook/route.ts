import { generatePlaybook } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 120

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: Request) {
  const { contact, prospect } = await req.json()
  const supabase = getSupabase()

  try {
    const { playbook, faqs } = await generatePlaybook(contact, prospect, prospect.description ?? '')

    // Delete existing playbook for this contact if regenerating
    await supabase.from('playbooks').delete()
      .eq('prospect_id', prospect.id).eq('contact_name', contact.name)
    await supabase.from('faqs').delete()
      .eq('prospect_id', prospect.id).eq('contact_name', contact.name)

    // Insert new playbook
    const { error: pbErr } = await supabase.from('playbooks').insert({
      prospect_id: prospect.id,
      ...playbook,
    })
    if (pbErr) throw pbErr

    // Insert FAQs in batches of 20
    for (let i = 0; i < faqs.length; i += 20) {
      await supabase.from('faqs').insert(
        faqs.slice(i, i + 20).map(f => ({ prospect_id: prospect.id, ...f }))
      )
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[playbook] failed:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
