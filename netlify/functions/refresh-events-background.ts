import type { Context } from '@netlify/functions'
import { purgeCache } from '@netlify/functions'
import { buildEventsPayload } from '../../src/lib/events'
import { EVENTS_BLOB_KEY, getEventsStore } from '../../src/lib/events-store'
import { EVENTS_CACHE_TAG } from './events'
import { HOMEPAGE_CACHE_TAG } from '../../src/routes/index'

// Background function with 15-minute timeout for long-running operations
// Called by the scheduled function to avoid the 30-second scheduled function limit
export default async (_req: Request, _context: Context) => {
  const startTime = Date.now()
  console.log('[background-refresh] Starting background events refresh')

  try {
    console.log('[background-refresh] Fetching events payload...')
    const payload = await buildEventsPayload()
    console.log(
      `[background-refresh] Fetched ${payload.events.today.length} events for today, ${payload.events.tomorrow.length} for tomorrow`,
    )

    const store = getEventsStore()
    console.log('[background-refresh] Storing payload to blob storage...')
    await store.setJSON(EVENTS_BLOB_KEY, payload)
    console.log('[background-refresh] Payload stored successfully')

    console.log('[background-refresh] Purging CDN cache...')
    await purgeCache({ tags: [EVENTS_CACHE_TAG, HOMEPAGE_CACHE_TAG] })
    console.log('[background-refresh] Cache purged successfully')

    const duration = Date.now() - startTime
    console.log(`[background-refresh] Completed successfully in ${duration}ms`)
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[background-refresh] Failed after ${duration}ms: ${message}`)
    if (error instanceof Error && error.stack) {
      console.error(`[background-refresh] Stack: ${error.stack}`)
    }
    throw error
  }
}
