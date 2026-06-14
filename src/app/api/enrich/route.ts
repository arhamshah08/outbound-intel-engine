import { enrichCompany } from '@/lib/enrichment'
import { generateBrief } from '@/lib/ai'

export const maxDuration = 300

export async function POST(req: Request) {
  const { companies, product, targetTitle, campaignName } = await req.json()

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
      const chunks: string[][] = []
      for (let i = 0; i < companies.length; i += 2) {
        chunks.push(companies.slice(i, i + 2))
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (company: string) => {
            const name = company.trim()
            if (!name) return

            send({ type: 'progress', company: name, message: 'Starting enrichment...' })

            try {
              const result = await enrichCompany(
                name,
                { product, targetTitle },
                (message: string) => send({ type: 'progress', company: name, message }),
              )
              send({ type: 'result', company: name, data: result })
            } catch (err) {
              send({
                type: 'error',
                company: name,
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
  const { company, product, targetTitle } = await req.json()
  try {
    const brief = await generateBrief(company, product, targetTitle)
    return Response.json({ brief })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
