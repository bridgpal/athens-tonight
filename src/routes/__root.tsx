/// <reference types="vite/client" />
import * as React from 'react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'

const SITE_URL = 'https://athens-bands.netlify.app'
const SITE_NAME = 'Athens Tonight'
const DEFAULT_TITLE = 'Athens Tonight | Live Music & Shows in Athens, GA'
const DEFAULT_DESCRIPTION = 'Discover live music happening tonight in Athens, GA. Find local bands, concerts, and shows at venues across the Classic City. Updated daily with tonight\'s events.'
const OG_IMAGE = `${SITE_URL}/og-image.svg`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#000000' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'description', content: DEFAULT_DESCRIPTION },
      // Robots
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: DEFAULT_TITLE },
      { property: 'og:description', content: DEFAULT_DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Athens Tonight - Live Music in Athens, GA' },
      { property: 'og:locale', content: 'en_US' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: DEFAULT_TITLE },
      { name: 'twitter:description', content: DEFAULT_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
      { name: 'twitter:image:alt', content: 'Athens Tonight - Live Music in Athens, GA' },
      // Additional SEO
      { name: 'author', content: SITE_NAME },
      { name: 'geo.region', content: 'US-GA' },
      { name: 'geo.placename', content: 'Athens' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' },
      { rel: 'canonical', href: SITE_URL },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
