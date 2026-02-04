import type { Config } from '@netlify/functions'
import { refreshEvents } from '../../src/lib/refresh'

// Scheduled function that directly refreshes events
// Using the shared refresh logic ensures environment variables are available
export default async () => {
  console.log('[scheduled-refresh] Starting scheduled events refresh')

  try {
    const { payload, durationMs } = await refreshEvents('scheduled-refresh')

    console.log(
      `[scheduled-refresh] Successfully refreshed ${payload.events.today.length} today, ${payload.events.tomorrow.length} tomorrow in ${durationMs}ms`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[scheduled-refresh] Failed: ${message}`)
    if (error instanceof Error && error.stack) {
      console.error(`[scheduled-refresh] Stack: ${error.stack}`)
    }
    throw error
  }
}

export const config: Config = {
  // Run every 6 hours to keep data fresh (1 AM, 7 AM, 1 PM, 7 PM UTC)
  schedule: '0 1,7,13,19 * * *',
}
