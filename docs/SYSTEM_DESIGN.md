# Flock system design

Last reviewed: 2026-09-29

## What Flock is

Flock is a mobile-first application for organizing run clubs. A run club is a
“flock.” The first complete product slice will let an organizer create a flock,
share an invitation, let another runner join, and show the flock's member list.
Events, routes, pace groups, chat, and monetization are intentionally deferred
until the membership workflow is useful.

Flock is being built as a progressive web app so runners can install and use it
from a phone without requiring an App Store release, native mobile toolchain, or
developer-program expense. The same application remains usable on desktop for
organizers.

## System overview

```text
Browser / installed PWA
        │
        ▼
React Router pages
        │
        ├── workflow hooks and providers
        │          │
        │          ▼
        │    data-access modules
        │          │
        │          ▼
        │       Supabase
        │    Auth · Postgres · Realtime · Storage
        │
        ▼
Presentational components
        │
        ▼
Reusable primitives
```

Cloudflare Pages will serve the compiled application. Supabase supplies the
backend capabilities. The browser may call Supabase directly only through its
public project configuration and under Row Level Security policies.

## Application stack

### React and TypeScript

React supplies the component model and ecosystem needed for a stateful,
multi-route product. TypeScript runs in strict mode so incorrect component
contracts and data shapes are caught before they reach a browser. Types are not
treated as a substitute for runtime validation at network and user-input
boundaries.

### Vite

Vite owns local development and production bundling. It keeps the initial setup
small, works directly with React and TypeScript, and integrates with the chosen
PWA and Tailwind plugins. Flock does not currently need server-side rendering;
the first workflows are authenticated application screens rather than public
search pages.

### React Router

React Router owns client-side routes. Shareable invitation URLs and the OAuth
callback require real, addressable routes rather than screen state hidden in a
single component. Pages remain the highest frontend layer and initiate complete
workflows.

### Tailwind CSS and semantic tokens

Tailwind provides composable layout and component utilities. It does not own
Flock's colors or visual meaning. `src/styles/tokens.css` is the canonical
runtime token source, and `src/styles/global.css` maps those values into
Tailwind aliases. `DESIGN.md` documents the accepted visual system.

The primary brand color is shamrock `#369F60`. Deep navy carries text and focus,
and warm coral is reserved for errors or exceptional emphasis. Reusable
primitives consume semantic names such as `primary`, `text`, and `border`
instead of embedding raw brand values in feature code.

### Progressive web app

`vite-plugin-pwa` generates the manifest and service worker. The application
shell and essential static assets are cached. Data mutations are not presented
as offline-capable: membership and authentication still require a network
connection. A new service worker asks before refreshing an open screen so an
update cannot silently discard in-progress work.

## Frontend boundaries

The default import and responsibility direction is:

```text
pages → components → primitives
```

### Primitives

Primitives are domain-neutral controls such as `Button` and `TextField`. They
own consistent semantics, accessible states, touch sizing, focus treatment, and
visual variants. They do not know about routes, flocks, Supabase, or data
queries.

### Components

Components combine primitives into reusable interface patterns. For example,
`EmailSignInForm` validates and emits a normalized email address, while
`EmailOtpForm` validates a code and exposes verification and resend intent.
They receive data and callbacks rather than calling Supabase directly.

### Pages

Pages own route-level workflows and assemble components. `SignInPage` uses
`useEmailAuthController` to connect the presentational authentication forms to
the data layer. Pages own whole-screen loading, error, authorization, and
success behavior.

### Hooks, providers, and data access

Every custom React hook lives in `src/hooks`. Tests that primarily exercise a
hook live beside it, while provider integration tests remain with their
provider. This provides one predictable home for workflow hooks, context
consumers, and future React Query hooks. Hooks can remain domain-specific even
though their files share a directory. `useEmailAuthController`, for example,
owns the email-authentication phase, mutation state, safe error copy,
duplicate-request protection, and resend cooldown.

Providers own application-wide state with a clear lifecycle.
`AuthSessionProvider` resolves the persisted session and subscribes to Supabase
authentication changes. It unsubscribes and ignores late asynchronous results
after unmounting. Provider components remain in their domain directory, such as
`src/auth`; their hook interfaces live in `src/hooks`.

Data-access modules are the only frontend layer that speaks in Supabase API
terms. `src/data/auth.ts` requests and verifies email codes, starts Google or
Facebook OAuth, reads sessions, subscribes to auth changes, and signs out. UI
code receives application-shaped state and messages rather than raw provider
errors.

## Authentication design

Supabase Auth is the authentication system. Flock plans to support Google,
Facebook, and email.

Email authentication uses a six-digit one-time password. It remains inside the
PWA instead of sending a runner through a magic-link browser handoff. The flow
is:

```text
/sign-in
  → submit email
  → Supabase sends six-digit code
  → show verification state on the same route
  → verify code
  → AuthSessionProvider receives the session
```

The submitted email stays visible during verification. A runner can return to
edit it. Resend uses a cooldown based on an absolute deadline, so the remaining
time corrects itself after a mobile tab has been backgrounded. Rate-limit,
invalid-code, expiration, and connection errors are translated into useful
application copy; raw provider messages are not displayed.

`/sign-in` resolves the current session before mounting the email workflow, so
an existing session never flashes the sign-in form. The loading state has an
honest document title and accessible status. When a session exists, the page
consumes the saved destination and replaces `/sign-in` with that location,
including after OTP verification publishes a new session. It falls back to `/`
when no safe destination exists. If the initial session check fails, the page
shows safe recovery copy and keeps sign-in available rather than exposing the
provider error.

Google and Facebook use Supabase OAuth with PKCE and return through
`/auth/callback`. The data boundary accepts only Flock's approved `google` and
`facebook` provider identifiers and constructs the callback from the current
application origin. Supabase then redirects the browser to the provider. The
callback URL must be allow-listed in each Supabase environment; provider client
secrets remain in Google, Facebook, and Supabase configuration.

`src/auth/destination.ts` owns intended-destination validation and per-tab
storage. It preserves the first valid internal path, including its query string
and hash, through an authentication redirect chain. Only paths beginning with a
single `/` are eligible; absolute URLs, protocol-relative URLs, backslashes,
surrounding whitespace, `/sign-in`, and `/auth/callback` paths are rejected.
The destination is consumed once after authentication and otherwise falls back
to `/`. `sessionStorage` survives a same-tab OAuth round trip without leaving a
stale cross-tab destination after the tab closes.

Sign-in restoration and protected-route preservation are implemented.
`ProtectedRoute` waits for initial session resolution before rendering private
content. A signed-out runner's complete location is preserved before the route
is replaced with `/sign-in`. Destination storage and navigation run in guarded
effects so render remains free of storage mutations and React Strict Mode
cannot repeat either one-time action during its development checks. OAuth
callback handling is not wired yet.

## Configuration and secrets

The frontend requires two public values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The `VITE_` prefix means Vite includes the value in the browser bundle. That is
appropriate for the project URL and publishable key, but never for a Supabase
secret or service-role key. Production and local runtime values remain outside
Git. `.env.test` contains explicitly fake values so automated tests cannot
depend on a developer's `.env.local` or accidentally call a real project.

## Testing strategy

Flock uses several testing layers because each catches a different class of
failure.

### Vitest and React Testing Library

Unit and behavior tests verify utilities, hooks, providers, primitives,
components, and pages in a fast DOM environment. They are best for validation,
state transitions, callback contracts, async cleanup, and error mapping.

### Playwright component tests

Component tests mount stories in a small Vite-powered gallery. The gallery is a
test harness, not a product route. These tests verify real-browser layout,
focus, hover, disabled states, accessibility relationships, and touch-target
geometry without requiring the complete application.

### Playwright page tests

Page tests navigate to the real application and exercise routing, page-to-hook
wiring, mocked network boundaries, loading, recovery, and responsive layout.
They currently run as separate desktop Chromium, Android-sized Chromium, and
iPhone WebKit projects.

### Continuous integration

GitHub Actions reports static analysis, unit tests, component tests, page tests,
and the production build as distinct checks. The separation makes failures
easier to identify and allows independent jobs to run in parallel. Browser
tests are split by device so a platform-specific failure is visible without
reading one combined log.

## Current constraints and revisit points

### Bundle size

The production bundle currently exceeds Vite's 500 kB warning threshold after
Supabase authentication is loaded. The warning has not been hidden or raised.
Route-level code splitting should be measured when more routes exist, rather
than added speculatively or replaced with a larger threshold.

### Authentication lifecycle profiling

The session provider cleans up its auth subscription and guards late session
responses, but long-running memory behavior has not been profiled in a
production-like session. Revisit this with browser performance tooling once
route protection causes more mount, redirect, and session-refresh activity.

### Server-state queries

React Query is the planned owner for reusable server-data queries and their
cache lifecycle. It has not been added yet because the work completed so far is
authentication mutation and session coordination rather than flock data
fetching. Add it with the first real server-data query, behind a domain-specific
custom hook.

### Backend authorization

No flock-owned database table should be used by the application until its Row
Level Security policies and authorization tests exist. Hiding a control in the
UI will never be treated as authorization.

## A short explanation of the architecture

Flock is a React and TypeScript progressive web app built with Vite. React
Router gives the product real routes, Tailwind implements a token-driven design
system, and Supabase provides authentication and will provide the database and
realtime features. Pages own workflows, presentational components collect user
intent, primitives enforce accessible interaction, hooks coordinate behavior,
and data modules isolate Supabase. Vitest checks logic quickly, while Playwright
checks components and complete pages in the browsers and phone sizes runners
will actually use.
