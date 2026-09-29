# Flock technical foundation

## Status

Accepted as the starting architecture. Revisit a decision only when product evidence or a concrete technical constraint requires it.

## Application

- **React with TypeScript** for the interface.
- **Vite** for local development and production builds.
- **React Router** for client-side routes and shareable flock invitation URLs.
- **npm** for package management, with the lockfile committed to keep installations reproducible.

Flock will begin as a single-page application. Server-side rendering is not required for the private membership flow, and avoiding it keeps the first implementation smaller.

## Progressive web app

- Use **vite-plugin-pwa** to generate the web app manifest and service worker.
- Support installation on mobile home screens from the first release.
- Cache the application shell and essential static assets.
- Do not support offline data changes initially. Membership actions require a network connection and must show a clear connection error when unavailable.
- Prompt people before activating an update that would reload an open screen.

## Backend and data

Use **Supabase** for:

- PostgreSQL data storage
- Authentication
- Realtime features when chat is introduced
- File storage when flock images are introduced
- Edge Functions only when an operation requires secrets or privileged server-side behavior

The browser may use the Supabase client directly for permitted operations. Every user-owned or flock-owned table must have Row Level Security enabled and tested before it is used by the application. Service-role credentials and other secrets must never be included in the client bundle.

## Authentication

Use **Supabase Auth** for:

- Google sign-in
- Facebook sign-in
- Email sign-in

The exact email experience—password, magic link, or one-time code—will be selected in the authentication branch before implementation. OAuth provider setup and redirect URLs must support both local development and the production domain.

## Interface and styling

- Use semantic HTML and accessible native controls whenever they meet the interaction requirements.
- Use CSS custom properties as the source of truth for design tokens.
- Use **Tailwind CSS** for component and layout styling, mapped to the semantic CSS custom properties.
- Keep one small global stylesheet for tokens, resets, and application-wide behavior. Add component CSS only when a behavior cannot be expressed clearly with shared Tailwind utilities.
- Do not add a component library or global state library until repeated product needs justify one.
- Target WCAG 2.2 AA and phone layouts first, beginning at a 360-pixel viewport width.

The approved visual foundation uses shamrock `#369f60` as the primary color, deep navy typography, a restrained warm coral accent, and a true-white background.

## Frontend architecture

Build the interface in three layers, ordered from least to most product-aware:

### Primitives

Primitives are the smallest reusable interface elements, such as buttons, text treatments, inputs, avatars, and icons.

- Keep primitives unaware of Flock's domain, routes, authentication, and data sources.
- Configure them through focused props, variants, and children.
- Do not query or mutate data from a primitive.
- Prefer native semantics and accessibility behavior over visual abstractions.
- Do not create a primitive for plain semantic HTML unless the abstraction adds a consistent behavior or design rule.

### Components

Components combine primitives into reusable interface patterns, such as forms, member lists, tables, and event cards.

- Keep components presentational whenever practical.
- Receive data and event callbacks through props rather than accessing Supabase or route loaders directly.
- Components may own local interface state that does not need to survive navigation or synchronize with the backend. Examples include an open disclosure, a selected tab, or an in-progress form draft.
- Move repeated business behavior into an explicit shared hook or domain module rather than hiding it inside a visual component.

### Pages

Pages are route-level entry points built from components and primitives.

- Start data queries and mutations at the page or route level whenever possible.
- Own loading, empty, error, authorization, and success states for the complete page workflow.
- Translate backend responses into the focused data shapes required by child components.
- Pass data downward and receive user intent upward through callbacks.
- Keep transport details in data-access modules or hooks even when the page initiates the operation.

The default import direction is:

`pages → components → primitives`

Code in a lower layer must not import from a higher layer. Data-access modules may be used by pages and route-level hooks, but never by primitives and only by a component when a documented exception is more coherent than page ownership.

Keep server state high without lifting every piece of state. Data shared across a workflow belongs at the closest page or route boundary; temporary interaction state belongs as close as possible to the control that uses it.

## Testing and quality

- TypeScript strict mode
- ESLint and Prettier
- Vitest and React Testing Library for component and behavior tests
- Playwright for critical end-to-end flows once the first complete flow exists
- Production build and mobile browser verification before each branch is considered complete

## Hosting

Deploy the compiled Vite application to **Cloudflare Pages** from the GitHub repository.

- Production deploys come from `main`.
- Pull requests receive preview deployments.
- Supabase remains the backend; Cloudflare serves the application assets.
- Environment-specific public Supabase configuration is supplied through deployment environment variables.

This keeps initial hosting costs low and leaves Cloudflare Workers available if a small server-side endpoint is needed later.

## Deferred decisions

Do not select these until the corresponding feature branch begins:

- Map and route provider
- Email delivery provider
- Analytics and error monitoring
- Push notification provider
- Payment provider and subscription model

## References

- [Vite documentation](https://vite.dev/guide/)
- [Vite PWA documentation](https://vite-pwa-org.netlify.app/guide/)
- [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- [Supabase Realtime documentation](https://supabase.com/docs/guides/realtime)
- [Cloudflare Pages React documentation](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)
