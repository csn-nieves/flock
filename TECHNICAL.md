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

- Use **vite-plugin-pwa** to generate the web app manifest and compile Flock's
  custom service worker. Workbox owns precaching and SPA navigation fallback;
  the custom worker also handles Web Push and notification clicks.
- Support installation on mobile home screens from the first release.
- Cache the application shell and essential static assets.
- Do not support offline data changes initially. Membership actions require a network connection and must show a clear connection error when unavailable.
- Prompt people before activating an update that would reload an open screen.

### Push notifications

- Use standards-based Web Push rather than a proprietary notification SDK.
  Browser push services remain the transport; a Supabase Edge Function signs
  and sends messages with VAPID.
- Request notification permission only after a direct action in Settings.
  Store one private subscription per browser or installed PWA, and let people
  disable only the current device.
- Keep the Events invitation inbox authoritative. A notification only announces
  a server-authorized pending invitation and deep-links to that inbox.
- Queue targeted recipients and current flock members when an invitation is
  created. Queue a later joiner while a universal flock invitation is active,
  and recheck membership, acceptance, cancellation, event time, and expiration
  immediately before delivery.
- Remove device subscriptions when a push service returns `404` or `410`.
  Delivery is best effort: operating systems and browsers may still suppress an
  alert after Flock successfully hands it to the push service.
- Keep the VAPID private key only in Supabase Edge Function secrets. The VAPID
  public key is intentionally supplied to both the frontend build and Edge
  Function.

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

### Email flow

Email sign-in uses a six-digit one-time password rather than a password or magic link. Keeping verification inside Flock avoids moving an installed-PWA user into a different browser context and removes password creation and recovery from the first slice.

- Request the code with `signInWithOtp`. New users may be created through this flow.
- Verify the submitted code with `verifyOtp` using the `email` type.
- Keep the submitted email visible while the code is pending and allow the person to change it.
- Offer resend only after the configured Supabase cooldown and explain rate-limit, expiration, network, and invalid-code failures without exposing raw provider errors.
- Configure the Supabase email template with `{{ .Token }}` so it sends a code instead of a magic link.

### Social flow

Google and Facebook use Supabase's OAuth flow with PKCE. Authentication starts in the current window and returns to `/auth/callback`, where Flock exchanges the authorization code for a session.

PKCE is a deliberate security choice for Flock's browser-delivered PWA. The
application is a public OAuth client, so any fixed client secret shipped in its
JavaScript would be visible and could not prove which browser started a sign-in
attempt. Instead, Supabase creates a fresh random code verifier for each flow
and sends only its derived challenge when authorization begins. The returned
authorization code can be exchanged only by the browser that still holds the
matching verifier, so intercepting the code alone is not enough to create a
session. Access and refresh tokens are issued only after that exchange rather
than being returned directly in the redirect URL.

The verifier is stored locally by the Supabase client. The callback exchange
must therefore finish in the same browser and device that started the flow.
Flock currently treats social sign-in as one in-flight flow per browser; if
real usage shows people starting overlapping flows across tabs, revisit
Supabase's flow-ID support rather than weakening PKCE.

- Register Supabase's provider callback URL with Google and Facebook.
- Add the local, preview, and production Flock callback URLs to Supabase's redirect allow list.
- Preserve the intended in-app destination before leaving Flock. Accept only same-origin relative paths when restoring it to prevent open redirects.
- Keep the first valid destination in per-tab `sessionStorage` until authentication consumes it. Preserve its pathname, query string, and hash, but reject `/sign-in`, `/auth/callback`, their nested paths, protocol-relative URLs, absolute URLs, and malformed paths.
- Default to `/` when there is no valid saved destination.
- Treat provider cancellation, denied consent, missing callback state, and failed code exchange as recoverable sign-in errors.

### Routes and session behavior

- `/sign-in` owns Google, Facebook, and email entry. Email verification is a second state of the same route rather than a separate page.
- `/auth/callback` owns the OAuth code exchange and then replaces itself in browser history with the saved destination.
- A protected route saves its complete internal path, including an invitation token, before sending a signed-out person to `/sign-in`.
- Resolve the initial session before rendering a protected page so private content does not flash while authentication loads.
- Persist the Supabase browser session and allow the client to refresh it. A session ends when the person signs out or Supabase invalidates it.
- A signed-in person who opens `/sign-in` continues to the valid saved destination or `/`.

OAuth configuration must support local development, pull-request previews, and the production domain. Provider secrets remain in provider and Supabase configuration and must never enter the Vite client bundle.

## Interface and styling

- Use semantic HTML and accessible native controls whenever they meet the interaction requirements.
- Use CSS custom properties as the source of truth for design tokens.
- Use **Tailwind CSS** for component and layout styling, mapped to the semantic CSS custom properties.
- Keep one small global stylesheet for tokens, resets, and application-wide behavior. Add component CSS only when a behavior cannot be expressed clearly with shared Tailwind utilities.
- Do not add a component library or global state library until repeated product needs justify one.
- Target WCAG 2.2 AA and phone layouts first, beginning at a 360-pixel viewport width.

The approved visual foundation uses shamrock `#369f60` as the primary color, deep navy typography, a restrained warm coral accent, and a true-white background.

## Frontend architecture

Organize the application from global composition down to reusable interface
elements. Give every routed screen an explicit controller boundary between the
router and its pure page:

```text
Application root
└── Global providers
    └── Router
        └── Route layouts and guards
            └── Route controllers
                ├── Router input, navigation, and metadata
                ├── Domain hooks
                │   └── Data-access modules
                │       └── Supabase
                └── Pages
                    └── Feature components
                        └── Primitives
```

This tree describes ownership and dependency direction, not only rendered DOM
parentage. Providers and routes compose the application globally. A route
controller talks to React Router and domain hooks, handles route-level async and
recovery decisions, and converts their results into application-shaped page
props. The page is unaware of URLs, navigation, query libraries, and transport.

Within the rendered interface, build from three layers ordered from least to
most product-aware:

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

### Route controllers

Route controllers live in `src/routes` and are the modules the router
configuration registers when a destination is ready to expose.

- Read path parameters, search parameters, location state, and saved navigation intent.
- Initiate domain hooks and own navigation, document metadata, and route-level side effects.
- Translate query and mutation results into clean, typed page props and safe recovery actions.
- Render route-level loading, authorization, not-found, and failure views when those states should not enter the successful page contract.
- Do not absorb visual layout or transport details that belong to pages, components, hooks, or data-access modules.

### Pages

Pages are pure screen views built from feature components and primitives.

- Receive clean, typed application data and callbacks through props.
- Remain unaware of React Router, React Query, and Supabase.
- Own screen layout and presentation states that are meaningfully part of the visible page experience.
- Pass data downward and receive user intent upward through callbacks.
- Keep page-only feature components beside their page. Promote them to `src/components` only after reuse establishes shared responsibility.

The default feature import direction is:

`routes → pages → components → primitives`

Code in a lower layer must not import from a higher layer. Route controllers use
domain hooks, and hooks may use data-access modules. Pages, components, and
primitives must not call data-access modules directly; importing focused domain
types is allowed when it does not introduce transport behavior.

Keep server state in the route controller without lifting every piece of state.
Temporary interaction state belongs as close as possible to the control that
uses it.

### Hooks

Keep every custom React hook in `src/hooks`. Colocate tests that primarily exercise a hook beside it; provider integration tests remain with their provider. This gives the application one predictable place for workflow hooks, context consumers, and future React Query hooks such as `useUser`, `useFlock`, and `useUpdateUser`.

Hooks may call data-access modules, but pages, components, and primitives receive
their results through props. Route controllers are the preferred place to start
server-state queries and mutations. Keep provider components and other
authentication infrastructure in `src/auth`; only their hook interfaces belong
in `src/hooks`.

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

- Bundle splitting: the production build currently triggers Vite's 500 kB chunk warning after loading Supabase authentication at startup. Revisit route-level code splitting as features are added, measure its effect on mobile startup performance, and do not raise the warning threshold as a substitute for optimization.
- Map and route provider
- Email delivery provider
- Analytics and error monitoring
- Payment provider and subscription model

## References

- [Vite documentation](https://vite.dev/guide/)
- [Vite PWA documentation](https://vite-pwa-org.netlify.app/guide/)
- [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- [Supabase passwordless email documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase PKCE documentation](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Supabase redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase session documentation](https://supabase.com/docs/guides/auth/sessions)
- [Supabase Realtime documentation](https://supabase.com/docs/guides/realtime)
- [Cloudflare Pages React documentation](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)
