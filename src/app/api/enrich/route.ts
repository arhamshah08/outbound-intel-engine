import { enrichCompany } from '@/lib/enrichment'
import { generateBrief } from '@/lib/ai'

export const maxDuration = 300

export async function POST(req: Request) {
  const { companies, product, campaignName } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      send({ type: 'start', total: companies.length, campaignName })

      // Process up to 2 companies in parallel
      const chunks: { name: string; website: string }[][] = []
      for (let i = 0; i < companies.length; i += 2) {
        chunks.push(companies.slice(i, i + 2))
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (company: { name: string; website: string }) => {
            const key = company.name.trim()
            if (!key) return

            send({ type: 'progress', company: key, message: 'Starting enrichment...' })

            try {
              const result = await enrichCompany(
                key,
                { product, domain: company.website },
                (step: string, message: string, iteration?: number) =>
                  send({ type: 'progress', company: key, step, message, iteration: iteration ?? 1 }),
              )
              send({ type: 'result', company: key, data: result })
            } catch (err) {
              send({
                type: 'error',
                company: key,
                message: err instanceof Error ? err.message : 'Enrichment failed',
              })
            }
          }),
        )
      }

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
  const { company, product } = await req.json()
  try {
    const brief = await generateBrief(company, product)
    return Response.json({ brief })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
