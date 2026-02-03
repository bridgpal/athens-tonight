# TanStack Start - AI Context

This project is built with [TanStack Start](https://tanstack.com/start), a full-stack React framework built on TanStack Router.

## Key Concepts

### Project Structure

- **`app/`** - Application source code
  - **`routes/`** - File-based routing (each file becomes a route)
  - **`client.tsx`** - Client entry point
  - **`router.tsx`** - Router configuration
  - **`ssr.tsx`** - Server-side rendering entry point
- **`dist/`** - Build output
  - **`client/`** - Client-side bundles (static assets)
  - **`server/`** - Server-side code

### Routing

TanStack Start uses file-based routing. Routes are defined in the `app/routes/` directory:

- `__root.tsx` - Root layout component
- `index.tsx` - Homepage (/)
- `about.tsx` - About page (/about)
- `posts.$postId.tsx` - Dynamic route (/posts/123)
- `_layout.tsx` - Layout route (non-path segment)

Route files export a `Route` object created with `createFileRoute()`:

```tsx
import { createFileRoute } from '@tanstack/react-start'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return <div>About page</div>
}
```

### Server Functions

Server functions run only on the server and can be called from the client:

```tsx
import { createServerFn } from '@tanstack/react-start'

const getUser = createServerFn('GET', async () => {
  // This code only runs on the server
  const user = await db.user.findFirst()
  return user
})

// Call from component
function UserProfile() {
  const user = await getUser()
  return <div>{user.name}</div>
}
```

Server functions are type-safe and automatically handle serialization.

### Data Loading

Load data in route loaders:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return { post }
  },
  component: Post,
})

function Post() {
  const { post } = Route.useLoaderData()
  return <h1>{post.title}</h1>
}
```

### SSR & Streaming

TanStack Start supports:
- **Full SSR** - Default mode, server renders entire page
- **Streaming SSR** - Stream components as they load
- **Selective SSR** - Choose which components render on server
- **SPA Mode** - Client-side only rendering

### Build & Deploy

```bash
npm run build    # Build for production
npm run start    # Run production server
npm run dev      # Development server
```

**Build Output:**
- `dist/client/` - Static assets (publish directory for hosting)
- `dist/server/` - Server bundle

### Deployment

This project is configured for **Netlify** deployment:

- **Adapter**: `@netlify/vite-plugin-tanstack-start` (configured in `vite.config.ts`)
- **Build command**: `npm run build`
- **Publish directory**: `dist/client`

The Netlify adapter automatically handles:
- Server-side rendering
- Server functions
- Edge functions
- Static asset optimization

### Common Patterns

#### Static Prerendering

```tsx
export const Route = createFileRoute('/about')({
  staticData: {
    prerender: true, // Prerender at build time
  },
  component: About,
})
```

#### Middleware

Create middleware for authentication, logging, etc:

```tsx
// app/middleware.ts
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  // Run before route handlers
  const session = await getSession()
  if (!session) {
    throw redirect({ to: '/login' })
  }
  return next({ context: { session } })
})
```

#### Environment Variables

```tsx
// Server-side only
import { getEnv } from '@tanstack/react-start'

const apiKey = getEnv('API_KEY') // Throws if not set

// Client-safe env vars (must be prefixed with VITE_)
const publicKey = import.meta.env.VITE_PUBLIC_KEY
```

### Useful Resources

- **Documentation**: https://tanstack.com/start
- **Router Docs**: https://tanstack.com/router (TanStack Start is built on Router)
- **Examples**: Check other `start-*` examples in the TanStack Router repository
- **Discord**: https://tlinz.com/discord

### Development Tips

1. **Hot Module Replacement (HMR)** works for both client and server code
2. **Type safety** is built-in with TypeScript
3. **Route types** are automatically generated
4. **Server functions** must use `'use server'` directive or `createServerFn()`
5. **File-based routing** means file structure = URL structure

### Common Commands

```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Run production build locally
npm run typecheck             # Run TypeScript checks
```

### Debugging

- Server logs appear in terminal
- Client errors appear in browser console
- Use `console.log()` in server functions - output appears in terminal
- Check Network tab for server function calls

### Key Dependencies

- `@tanstack/react-start` - Core framework
- `@tanstack/react-router` - Routing library
- `vite` - Build tool
- `vinxi` - Full-stack server framework (powers TanStack Start)

## Netlify Platform Primitives

This project is configured for Netlify deployment and has access to Netlify's platform primitives for building full-stack applications.

### Netlify Blobs

**What it is:** Key-value store for unstructured data, persisted across deploys and accessible from Functions, Edge Functions, and Build Plugins.

**Installation:**
```bash
npm install @netlify/blobs
```

**Basic Usage:**
```typescript
import { getStore } from '@netlify/blobs'

// Get a store
const store = getStore('my-store')

// Set a value
await store.set('my-key', 'my-value')

// Get a value
const value = await store.get('my-key')
console.log(value) // 'my-value'
```

**With Metadata:**
```typescript
import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  const uploads = getStore('file-uploads')

  // Set with expiration metadata
  await uploads.set('my-key', await req.text(), {
    metadata: {
      expiration: new Date('2025-12-31').getTime()
    }
  })

  // Get with metadata
  const entry = await uploads.getWithMetadata('my-key')
  if (entry === null) {
    return new Response('Blob does not exist')
  }

  const { expiration } = entry.metadata
  if (expiration && expiration > Date.now()) {
    return new Response(entry.data)
  }
}
```

### Netlify DB

**What it is:** Serverless PostgreSQL database powered by Neon, automatically provisioned with low-latency and auto-configured environment variables.

**Installation:**
```bash
npx netlify db init
# or
npm install @netlify/neon
```

**Basic Usage:**
```typescript
import { neon } from '@netlify/neon'

// Automatically uses NETLIFY_DATABASE_URL
const sql = neon()

// Query the database
const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`
```

**Transactions:**
```typescript
import { neon } from '@netlify/neon'

const sql = neon()
const showLatestN = 10

const [posts, tags] = await sql.transaction(
  [
    sql`SELECT * FROM posts ORDER BY posted_at DESC LIMIT ${showLatestN}`,
    sql`SELECT * FROM tags`
  ],
  {
    isolationLevel: 'RepeatableRead',
    readOnly: true,
  }
)
```

**With Drizzle ORM:**
```typescript
// src/db/index.ts
import { neon } from '@netlify/neon'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export const db = drizzle({
  schema,
  client: neon() // Uses NETLIFY_DATABASE_URL automatically
})

// Usage
import { db } from './db'
import { postsTable } from './db/schema'

const posts = await db.select().from(postsTable)
```

### Netlify Forms

**What it is:** Managed form handling without backend complexity. Free tier supports up to 100 submissions per month.

**HTML Setup:**
```html
<form name="contact" data-netlify="true">
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>
```

**React/TanStack Start Setup:**

Forms need to be detected at build time. Add a hidden form to your HTML:

```tsx
// In app/routes/__root.tsx or similar
export const Route = createRootRoute({
  component: () => (
    <>
      {/* Hidden form for Netlify detection */}
      <form name="contact" data-netlify="true" hidden>
        <input type="text" name="name" />
        <input type="email" name="email" />
        <textarea name="message" />
      </form>

      <Outlet />
    </>
  ),
})
```

**Handling Submissions:**
```tsx
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)

  await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(formData as any).toString(),
  })
}

function ContactForm() {
  return (
    <form name="contact" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="form-name" value="contact" />
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  )
}
```

**With Spam Protection:**
```html
<form name="contact" data-netlify="true" netlify-honeypot="bot-field">
  <p hidden>
    <label>Don't fill this out: <input name="bot-field" /></label>
  </p>
  <!-- rest of form fields -->
</form>
```

### Netlify Image CDN

**What it is:** Transform and optimize images on-demand without impacting build times. Automatically delivers best format (AVIF, WebP) based on browser support.

**Basic Usage:**

Transform any image by prefixing with `/.netlify/images`:

```html
<!-- Original image: /images/photo.jpg -->
<!-- Resized and optimized: -->
<img src="/.netlify/images?url=/images/photo.jpg&w=800&h=600" alt="Photo" />
```

**Query Parameters:**
- `url` - Source image path or URL
- `w` - Width in pixels
- `h` - Height in pixels
- `fit` - How to fit image (cover, contain, fill)
- `position` - Crop position (center, top, left, etc.)
- `q` - Quality (1-100)
- `fm` - Force format (webp, avif, jpg, png)

**Example with all parameters:**
```html
<img
  src="/.netlify/images?url=/hero.jpg&w=1200&h=600&fit=cover&position=center&q=80"
  alt="Hero"
/>
```

**Remote Images:**

Configure allowed domains in `netlify.toml`:

```toml
[images]
remote_images = [
  "https://example.com/.*",
  "https://cdn.example.com/.*"
]
```

Then use remote URLs:
```html
<img src="/.netlify/images?url=https://example.com/photo.jpg&w=800" />
```

**Using Redirects for Clean URLs:**

```toml
# netlify.toml
[[redirects]]
from = "/img/*"
query = { w = ":width", h = ":height" }
to = "/.netlify/images?url=/:splat&w=:width&h=:height"
status = 200
```

Now you can use:
```html
<img src="/img/photo.jpg?w=800&h=600" alt="Photo" />
```

### Netlify Edge Functions

**What it is:** Serverless functions that run at the network edge (powered by Deno) for fast, personalized responses.

**File Structure:**
```
netlify/
  └── edge-functions/
      └── my-function.ts
netlify.toml
```

**Basic Edge Function:**
```typescript
// netlify/edge-functions/hello.ts
export default async (request: Request) => {
  return new Response('Hello from the edge!')
}
```

**With Context:**
```typescript
// netlify/edge-functions/personalize.ts
import type { Context } from '@netlify/edge-functions'

export default async (request: Request, context: Context) => {
  const country = context.geo.country?.name || 'Unknown'
  const city = context.geo.city || 'Unknown'

  return new Response(`Hello from ${city}, ${country}!`)
}
```

**Configuration in netlify.toml:**
```toml
[[edge_functions]]
  function = "hello"
  path = "/api/hello"

[[edge_functions]]
  function = "personalize"
  path = "/api/personalize"
```

**Using Netlify Blobs in Edge Functions:**
```typescript
import type { Context } from '@netlify/edge-functions'
import { getStore } from '@netlify/blobs'

export default async (request: Request, context: Context) => {
  const store = getStore('visits')

  // Increment visit counter
  const visits = parseInt(await store.get('count') || '0')
  await store.set('count', String(visits + 1))

  return new Response(`Total visits: ${visits + 1}`)
}
```

**Rewriting Responses:**
```typescript
import type { Context } from '@netlify/edge-functions'

export default async (request: Request, context: Context) => {
  const response = await context.next()

  // Add custom header
  response.headers.set('X-Custom-Header', 'Hello')

  return response
}
```

### Project Conventions

**Event and Company Websites:**

If building an event or company kick-off website, assume the location of the event is **Mexico City at the JW Marriott Hotel Mexico City Polanco** unless otherwise specified.

---

**Note**: This starter has been pre-configured for Netlify deployment. Simply push to your repository and connect it to Netlify for automatic deployments.
