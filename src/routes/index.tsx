import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as React from 'react'
import { EVENTS_BLOB_KEY, getEventsStore } from '~/lib/events-store'

type EventItem = {
  title: string
  url: string
  time: string
  venue: string
  date: string
}

type EventsPayload = {
  fetchedAt: string
  source: string
  today: string
  tomorrow: string
  events: {
    today: EventItem[]
    tomorrow: EventItem[]
  }
}

export const HOMEPAGE_CACHE_TAG = 'homepage'

const getEventsData = createServerFn({ method: 'GET' }).handler(async () => {
  const store = getEventsStore()
  const payload = await store.get(EVENTS_BLOB_KEY, { type: 'json' }) as EventsPayload | null
  return payload
})

export const Route = createFileRoute('/')({
  loader: async () => {
    const data = await getEventsData()
    return { data }
  },
  headers: () => ({
    'Netlify-CDN-Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
    'Netlify-Cache-Tag': HOMEPAGE_CACHE_TAG,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { data } = Route.useLoaderData()
  const error = data === null ? 'Events are warming up. Try again soon.' : null

  const updatedAt = React.useMemo(() => {
    if (!data) {
      return ''
    }
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(data.fetchedAt))
  }, [data])

  return (
    <main className="page">
      <section className="hero">
        <div className="badge">&gt;&gt; Athens, GA</div>
        <h1>TONIGHT&apos;S SHOWS</h1>
        {data && <p className="subhead">Today · {data.today} // Live music. Local scene. No bullshit.</p>}
        {!data && <p className="subhead">// Live music. Local scene. No bullshit.</p>}
      </section>

      <section className="panel">
        {error && <div className="status error">{error}</div>}
        {!error && !data && (
          <div className="status">[ NO DATA AVAILABLE ]</div>
        )}

        {data && (
          <>
            {data.events.today.length === 0 ? (
              <div className="status empty">
                NO SHOWS LISTED YET. CHECK BACK.
              </div>
            ) : (
              <ul className="event-list">
                {data.events.today.map((event) => (
                  <li key={`${event.title}-${event.time}`} className="event-card">
                    <div className="event-time">{event.time}</div>
                    <div className="event-body">
                      <a href={event.url} target="_blank" rel="noreferrer">
                        {event.title}
                      </a>
                      <span className="event-venue">{event.venue}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {data && data.events.tomorrow.length > 0 && (
        <details className="tomorrow">
          <summary>[+] TOMORROW</summary>
          <ul className="event-list muted">
            {data.events.tomorrow.map((event) => (
              <li key={`${event.title}-${event.time}`} className="event-card">
                <div className="event-time">{event.time}</div>
                <div className="event-body">
                  <a href={event.url} target="_blank" rel="noreferrer">
                    {event.title}
                  </a>
                  <span className="event-venue">{event.venue}</span>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <footer className="footer">
        <span>SRC: FLAGPOLE.COM</span>
        {data && <span>Updated {updatedAt}</span>}
      </footer>
    </main>
  )
}
