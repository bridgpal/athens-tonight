import { createFileRoute } from '@tanstack/react-router'
import Counter from '~/components/Counter'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About | Athens Tonight - Live Music in Athens, GA' },
      { name: 'description', content: 'Learn about Athens Tonight, your guide to live music and shows in Athens, Georgia. Discover the local music scene in the Classic City.' },
      // Open Graph overrides for this page
      { property: 'og:title', content: 'About | Athens Tonight - Live Music in Athens, GA' },
      { property: 'og:description', content: 'Learn about Athens Tonight, your guide to live music and shows in Athens, Georgia. Discover the local music scene in the Classic City.' },
      { property: 'og:url', content: 'https://athens-bands.netlify.app/about' },
      // Twitter overrides for this page
      { name: 'twitter:title', content: 'About | Athens Tonight - Live Music in Athens, GA' },
      { name: 'twitter:description', content: 'Learn about Athens Tonight, your guide to live music and shows in Athens, Georgia. Discover the local music scene in the Classic City.' },
    ],
    links: [
      { rel: 'canonical', href: 'https://athens-bands.netlify.app/about' },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main>
      <h1>About</h1>
      <Counter />
    </main>
  )
}
