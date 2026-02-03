import type { Config, Context } from '@netlify/functions'
import { buildEventsPayload } from '../../src/lib/events'
import { EVENTS_BLOB_KEY, getEventsStore } from '../../src/lib/events-store'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await buildEventsPayload()
  const store = getEventsStore()
  await store.setJSON(EVENTS_BLOB_KEY, payload)

  return new Response(
    JSON.stringify({
      ok: true,
      fetchedAt: payload.fetchedAt,
      today: payload.today,
      tomorrow: payload.tomorrow,
      counts: {
        today: payload.events.today.length,
        tomorrow: payload.events.tomorrow.length,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  )
}

export const config: Config = {
  path: '/api/refresh',
}
