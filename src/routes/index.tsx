import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as React from 'react'
import type { EventItem, EventsPayload } from '~/lib/events'
import { EVENTS_BLOB_KEY, getEventsStore } from '~/lib/events-store'
import { HOMEPAGE_CACHE_TAG } from '~/lib/refresh'

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
  head: () => ({
    meta: [
      { title: 'Athens Tonight | Live Music & Shows in Athens, GA' },
    ],
  }),
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

  const jsonLd = React.useMemo(() => {
    const graph: Record<string, unknown>[] = [
      {
        '@type': 'WebSite',
        '@id': 'https://athens-bands.netlify.app/#website',
        url: 'https://athens-bands.netlify.app',
        name: 'Athens Tonight',
        description: 'Discover live music happening tonight in Athens, GA. Find local bands, concerts, and shows at venues across the Classic City.',
        publisher: {
          '@id': 'https://athens-bands.netlify.app/#organization',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://athens-bands.netlify.app/#organization',
        name: 'Athens Tonight',
        url: 'https://athens-bands.netlify.app',
        areaServed: {
          '@type': 'City',
          name: 'Athens',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Athens',
            addressRegion: 'GA',
            addressCountry: 'US',
          },
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://athens-bands.netlify.app/#webpage',
        url: 'https://athens-bands.netlify.app',
        name: 'Athens Tonight | Live Music & Shows in Athens, GA',
        isPartOf: {
          '@id': 'https://athens-bands.netlify.app/#website',
        },
        about: {
          '@id': 'https://athens-bands.netlify.app/#organization',
        },
        description: 'Discover live music happening tonight in Athens, GA. Find local bands, concerts, and shows at venues across the Classic City.',
      },
    ]

    if (data && data.events.today.length > 0) {
      const eventSchemas = data.events.today.map((event, index) => ({
        '@type': 'MusicEvent',
        '@id': `https://athens-bands.netlify.app/#event-${index}`,
        name: event.title,
        url: event.url,
        startDate: event.date,
        location: {
          '@type': 'MusicVenue',
          name: event.venue,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Athens',
            addressRegion: 'GA',
            addressCountry: 'US',
          },
        },
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
      }))
      graph.push(...eventSchemas)
    }

    return {
      '@context': 'https://schema.org',
      '@graph': graph,
    }
  }, [data])

  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="hero">
        <h1>TONIGHT&apos;S SHOWS</h1>
        <p className="subhead">Live music. Local scene. No bullshit.</p>
      </section>

      <div className="badge">
        <span>&gt;&gt; Athens, GA</span>
        {data && <span className="badge-date">{data.today}</span>}
      </div>

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
