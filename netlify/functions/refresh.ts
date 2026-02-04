import type { Config, Context } from '@netlify/functions'
import { refreshEvents } from '../../src/lib/refresh'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { payload, durationMs } = await refreshEvents('manual-refresh')

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
        durationMs,
      }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[manual-refresh] Failed: ${message}`)
    if (error instanceof Error && error.stack) {
      console.error(`[manual-refresh] Stack: ${error.stack}`)
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  }
}

export const config: Config = {
  path: '/api/refresh',
}
