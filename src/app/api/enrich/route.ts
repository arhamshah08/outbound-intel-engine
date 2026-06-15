import { enrichCompany } from '@/lib/enrichment'
import { generateBrief } from '@/lib/ai'

export const maxDuration = 300

export async function POST(req: Request) {
  const { companies, product, campaignName, tags } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      send({ type: 'start', total: companies.length, campaignName })

      // Process ALL companies in parallel — sequential chunks caused timeout with 5+ companies
      await Promise.all(
        companies.map(async (company: { name: string; website: string }) => {
          const key = company.name.trim()
          if (!key) return

          send({ type: 'progress', company: key, step: 'discover', message: 'Starting...', iteration: 1 })

          try {
            const result = await enrichCompany(
              key,
              { product, domain: company.website, tags },
              (step: string, message: string, iteration?: number, snippet?: string) =>
                send({ type: 'progress', company: key, step, message, iteration: iteration ?? 1, snippet }),
            )
            send({ type: 'result', company: key, data: result })
          } catch (err) {
            send({ type: 'error', company: key, message: err instanceof Error ? err.message : 'Enrichment failed' })
          }
        }),
      )

      send({ type: 'done' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function PUT(req: Request) {
  const { company, product, prospectId } = await req.json()
  try {
    const brief = await generateBrief(company, product)
    // If prospectId provided, save brief to the prospect record
    if (prospectId) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      await supabase.from('prospects').update({ call_brief: brief }).eq('id', prospectId)
    }
    return Response.json({ brief })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
