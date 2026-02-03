import type { Config, Context } from '@netlify/functions'
import { EVENTS_BLOB_KEY, getEventsStore } from '../../src/lib/events-store'

export default async (_req: Request, _context: Context) => {
  const store = getEventsStore()
  const payload = await store.get(EVENTS_BLOB_KEY, { type: 'json' })

  if (!payload) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'No events cached yet. Try again soon.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

export const config: Config = {
  path: '/api/events',
}
