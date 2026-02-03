import type { Config, Context } from '@netlify/functions'
import { purgeCache } from '@netlify/functions'
import { buildEventsPayload } from '../../src/lib/events'
import { EVENTS_BLOB_KEY, getEventsStore } from '../../src/lib/events-store'
import { EVENTS_CACHE_TAG } from './events'
import { HOMEPAGE_CACHE_TAG } from '../../src/routes/index'

export default async (_req: Request, _context: Context) => {
  const payload = await buildEventsPayload()
  const store = getEventsStore()
  await store.setJSON(EVENTS_BLOB_KEY, payload)

  // Purge the CDN cache so the new data is served immediately
  await purgeCache({ tags: [EVENTS_CACHE_TAG, HOMEPAGE_CACHE_TAG] })
}

export const config: Config = {
  schedule: '0 */12 * * *',
}
