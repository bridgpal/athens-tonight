const SOURCE_URL =
  'https://flagpole.com/events/list/?tribe_eventcategory%5B0%5D=13592'
const JINA_URL =
  'https://r.jina.ai/http://flagpole.com/events/list/?tribe_eventcategory%5B0%5D=13592'

const ATHENS_TIME_ZONE = 'America/New_York'

const MONTHS: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
}

type DateParts = {
  year: number
  month: number
  day: number
}

export type EventItem = {
  title: string
  url: string
  time: string
  venue: string
  date: string
}

export type EventsPayload = {
  fetchedAt: string
  source: string
  today: string
  tomorrow: string
  events: {
    today: EventItem[]
    tomorrow: EventItem[]
  }
}

const getDateParts = (date: Date, timeZone: string): DateParts => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  }
}

const formatDateParts = ({ year, month, day }: DateParts) => {
  const yyyy = String(year)
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getAthensDates = () => {
  const now = new Date()
  const todayParts = getDateParts(now, ATHENS_TIME_ZONE)
  const tomorrowParts = getDateParts(
    new Date(now.getTime() + 24 * 60 * 60 * 1000),
    ATHENS_TIME_ZONE,
  )

  return {
    today: formatDateParts(todayParts),
    tomorrow: formatDateParts(tomorrowParts),
  }
}

const resolveEventDate = (monthName: string, day: number) => {
  const monthIndex = MONTHS[monthName]
  if (monthIndex === undefined) {
    return null
  }

  const todayParts = getDateParts(new Date(), ATHENS_TIME_ZONE)
  let year = todayParts.year

  if (monthIndex === 0 && todayParts.month === 12) {
    year += 1
  }

  return formatDateParts({ year, month: monthIndex + 1, day })
}

const extractMarkdownLink = (line: string) => {
  const match = line.match(/^### \[(.+?)\]\(([^\s)]+)[^)]*\)/)
  if (!match) {
    return null
  }
  return {
    title: match[1].trim(),
    url: match[2].trim(),
  }
}

const findVenueLine = (lines: string[], startIndex: number) => {
  for (let index = startIndex; index < lines.length; index += 1) {
    const candidate = lines[index].trim()
    if (!candidate) {
      continue
    }
    if (
      candidate.startsWith('**') ||
      candidate.startsWith('[') ||
      candidate.startsWith('###') ||
      candidate.startsWith('Event Category') ||
      candidate.startsWith('Events Search')
    ) {
      continue
    }
    return candidate
  }
  return ''
}

export const parseEventsFromMarkdown = (markdown: string) => {
  const lines = markdown.split('\n')
  const events: EventItem[] = []

  let currentDate: string | null = null
  let currentTime = ''

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line) {
      continue
    }

    const dateMatch = line.match(
      /^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s+@\s+(.+)$/,
    )

    if (dateMatch) {
      const [, monthName, dayText, timeText] = dateMatch
      const day = Number(dayText)
      const date = resolveEventDate(monthName, day)

      if (date) {
        currentDate = date
        currentTime = timeText.split('[')[0].trim()
      }
      continue
    }

    if (line.startsWith('### [')) {
      const link = extractMarkdownLink(line)
      if (!link || !currentDate) {
        continue
      }

      const venue = findVenueLine(lines, index + 1)
      events.push({
        title: link.title,
        url: link.url,
        time: currentTime,
        venue,
        date: currentDate,
      })
    }
  }

  return events
}

type NetlifyEnv =
  | Record<string, string>
  | { toObject?: () => Record<string, string> }

const getNetlifyEnv = () => {
  const netlify = (
    globalThis as unknown as { Netlify?: { env?: NetlifyEnv } }
  ).Netlify
  const env = netlify?.env
  if (!env) {
    return undefined
  }
  if (typeof (env as { toObject?: () => Record<string, string> }).toObject === 'function') {
    return (env as { toObject: () => Record<string, string> }).toObject()
  }
  return env as Record<string, string>
}

const buildBrowserHeaders = () => {
  const headers = new Headers({
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    priority: 'u=0, i',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  })

  const cookie = getNetlifyEnv()?.FLAGPOLE_COOKIE
  if (cookie) {
    headers.set('cookie', cookie)
  }

  return headers
}

const fetchWithTimeout = async (
  url: string,
  headers: Headers,
  timeoutMs = 15000,
) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    })

    return response
  } finally {
    clearTimeout(timeout)
  }
}

const isCloudflareChallenge = (content: string) =>
  content.includes('Just a moment') ||
  content.includes('cf-chl') ||
  content.includes('Enable JavaScript and cookies')

const parseEventTime = (dateText: string) => {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ATHENS_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const parseEventDate = (dateText: string) => {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const parts = getDateParts(date, ATHENS_TIME_ZONE)
  return formatDateParts(parts)
}

const extractJsonLdEvents = (html: string) => {
  const events: EventItem[] = []
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  let match: RegExpExecArray | null = null
  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonText = match[1].trim()
    if (!jsonText) {
      continue
    }

    try {
      const parsed = JSON.parse(jsonText) as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
      const graph = (parsed as Record<string, unknown>)['@graph']
      const candidates = Array.isArray(parsed)
        ? parsed
        : Array.isArray(graph)
          ? (graph as Array<Record<string, unknown>>)
          : [parsed]

      for (const candidate of candidates) {
        const rawType = candidate['@type']
        const types = Array.isArray(rawType) ? rawType : [rawType]
        const isEvent = types.some(
          (type) => typeof type === 'string' && type.includes('Event'),
        )
        if (!isEvent) {
          continue
        }

        const title =
          typeof candidate.name === 'string' ? candidate.name.trim() : ''
        const url =
          typeof candidate.url === 'string'
            ? candidate.url
            : typeof candidate['@id'] === 'string'
              ? candidate['@id']
              : ''
        const startDate =
          typeof candidate.startDate === 'string' ? candidate.startDate : ''
        const date = startDate ? parseEventDate(startDate) : null
        if (!title || !url || !date) {
          continue
        }

        const location = candidate.location as
          | Record<string, unknown>
          | string
          | undefined
        const venue =
          typeof location === 'string'
            ? location
            : typeof location?.name === 'string'
              ? location.name
              : typeof (location as { address?: { name?: string } })?.address
                  ?.name === 'string'
                ? (location as { address: { name: string } }).address.name
                : ''

        events.push({
          title,
          url,
          time: startDate ? parseEventTime(startDate) : '',
          venue,
          date,
        })
      }
    } catch {
      continue
    }
  }

  return events
}

const parseEventsFromHtml = (html: string) => {
  const events = extractJsonLdEvents(html)
  return events
}

const fetchEventsSource = async () => {
  const headers = buildBrowserHeaders()
  const htmlResponse = await fetchWithTimeout(SOURCE_URL, headers)

  if (htmlResponse.ok) {
    const html = await htmlResponse.text()
    if (!isCloudflareChallenge(html)) {
      return { format: 'html' as const, body: html }
    }
  }

  const jinaResponse = await fetchWithTimeout(JINA_URL, headers)
  if (!jinaResponse.ok) {
    throw new Error(`Failed to fetch events (${jinaResponse.status})`)
  }
  return { format: 'markdown' as const, body: await jinaResponse.text() }
}

export const fetchEventsMarkdown = async () => {
  const source = await fetchEventsSource()
  if (source.format !== 'markdown') {
    throw new Error('Expected markdown response but received HTML')
  }
  return source.body
}

export const buildEventsPayload = async (): Promise<EventsPayload> => {
  const { today, tomorrow } = getAthensDates()
  const source = await fetchEventsSource()
  const events =
    source.format === 'markdown'
      ? parseEventsFromMarkdown(source.body)
      : parseEventsFromHtml(source.body)

  const todayEvents = events.filter((event) => event.date === today)
  const tomorrowEvents = events.filter((event) => event.date === tomorrow)

  return {
    fetchedAt: new Date().toISOString(),
    source: SOURCE_URL,
    today,
    tomorrow,
    events: {
      today: todayEvents,
      tomorrow: tomorrowEvents,
    },
  }
}
