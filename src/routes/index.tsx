import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

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

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [data, setData] = React.useState<EventsPayload | null>(null)
  const [error, setError] = React.useState<string | null>(null)

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

  React.useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetch('/api/events')
        if (!response.ok) {
          throw new Error('Events are warming up. Try again soon.')
        }
        const payload = (await response.json()) as EventsPayload
        if (mounted) {
          setData(payload)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load events.')
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="page">
      <section className="hero">
        <div className="badge">Athens, GA</div>
        <h1>Tonight&apos;s Bands</h1>
        <p className="subhead">Live music in Athens for tonight only.</p>
      </section>

      <section className="panel">
        {error && <div className="status error">{error}</div>}
        {!error && !data && (
          <div className="status">Loading tonight&apos;s lineup…</div>
        )}

        {data && (
          <>
            <div className="meta">
              <span className="date-chip">Today · {data.today}</span>
              <span className="update">Updated {updatedAt}</span>
            </div>
            {data.events.today.length === 0 ? (
              <div className="status empty">
                No listings pulled for tonight yet. Check back soon.
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
          <summary>Tomorrow (tap to reveal)</summary>
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
        <span>Source: Flagpole live music calendar</span>
        <span>Auto-refreshes every 12 hours</span>
      </footer>
    </main>
  )
}
