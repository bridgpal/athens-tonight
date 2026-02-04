import type { Config, Context } from '@netlify/functions'

// Scheduled function that triggers the background function
// This avoids the 30-second timeout limit of scheduled functions
export default async (_req: Request, context: Context) => {
  console.log('[scheduled-refresh] Triggering background refresh function')

  try {
    // Get the site URL from context or environment
    const siteUrl =
      context.site?.url ||
      Netlify.env.get('URL') ||
      'https://athens-bands.netlify.app'

    // Trigger the background function
    const response = await fetch(
      `${siteUrl}/.netlify/functions/refresh-events-background`,
      {
        method: 'POST',
      },
    )

    // Background functions return 202 Accepted immediately
    if (response.status === 202) {
      console.log(
        '[scheduled-refresh] Background function triggered successfully',
      )
    } else {
      console.error(
        `[scheduled-refresh] Unexpected response status: ${response.status}`,
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[scheduled-refresh] Failed to trigger background function: ${message}`)
    throw error
  }
}

export const config: Config = {
  // Run every 6 hours to keep data fresh (1 AM, 7 AM, 1 PM, 7 PM UTC)
  schedule: '0 1,7,13,19 * * *',
}
