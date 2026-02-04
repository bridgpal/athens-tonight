import { purgeCache } from '@netlify/functions'
import { buildEventsPayload, EventsPayload } from './events'
import { EVENTS_BLOB_KEY, getEventsStore } from './events-store'

export const HOMEPAGE_CACHE_TAG = 'homepage'

export type RefreshResult = {
  payload: EventsPayload
  durationMs: number
}

export const refreshEvents = async (logPrefix: string): Promise<RefreshResult> => {
  const startTime = Date.now()
  console.log(`[${logPrefix}] Starting events refresh`)

  console.log(`[${logPrefix}] Fetching events payload...`)
  const payload = await buildEventsPayload()
  console.log(
    `[${logPrefix}] Fetched ${payload.events.today.length} events for today, ${payload.events.tomorrow.length} for tomorrow`,
  )

  const store = getEventsStore()
  console.log(`[${logPrefix}] Storing payload to blob storage...`)
  await store.setJSON(EVENTS_BLOB_KEY, payload)
  console.log(`[${logPrefix}] Payload stored successfully`)

  console.log(`[${logPrefix}] Purging CDN cache...`)
  await purgeCache({ tags: [HOMEPAGE_CACHE_TAG] })
  console.log(`[${logPrefix}] Cache purged successfully`)

  const durationMs = Date.now() - startTime
  console.log(`[${logPrefix}] Completed successfully in ${durationMs}ms`)

  return { payload, durationMs }
}
