import type { Config, Context } from '@netlify/functions'
import { buildEventsPayload } from '../../src/lib/events'
import { EVENTS_BLOB_KEY, getEventsStore } from '../../src/lib/events-store'

export default async (_req: Request, _context: Context) => {
  const payload = await buildEventsPayload()
  const store = getEventsStore()
  await store.setJSON(EVENTS_BLOB_KEY, payload)
}

export const config: Config = {
  schedule: '0 */12 * * *',
}
