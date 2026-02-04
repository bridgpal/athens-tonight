import type { Config, Context } from '@netlify/functions'
import { purgeCache } from '@netlify/functions'
import { buildEventsPayload } from '../../src/lib/events'
import { EVENTS_BLOB_KEY, getEventsStore } from '../../src/lib/events-store'
import { EVENTS_CACHE_TAG } from './events'
import { HOMEPAGE_CACHE_TAG } from '../../src/routes/index'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const startTime = Date.now()
  console.log('[manual-refresh] Starting manual events refresh')

  try {
    console.log('[manual-refresh] Fetching events payload...')
    const payload = await buildEventsPayload()
    console.log(
      `[manual-refresh] Fetched ${payload.events.today.length} events for today, ${payload.events.tomorrow.length} for tomorrow`,
    )

    const store = getEventsStore()
    console.log('[manual-refresh] Storing payload to blob storage...')
    await store.setJSON(EVENTS_BLOB_KEY, payload)
    console.log('[manual-refresh] Payload stored successfully')

    console.log('[manual-refresh] Purging CDN cache...')
    await purgeCache({ tags: [EVENTS_CACHE_TAG, HOMEPAGE_CACHE_TAG] })
    console.log('[manual-refresh] Cache purged successfully')

    const duration = Date.now() - startTime
    console.log(`[manual-refresh] Completed successfully in ${duration}ms`)

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
        durationMs: duration,
      }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[manual-refresh] Failed after ${duration}ms: ${message}`)
    if (error instanceof Error && error.stack) {
      console.error(`[manual-refresh] Stack: ${error.stack}`)
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
        durationMs: duration,
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
