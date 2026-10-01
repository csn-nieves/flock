# Flock system design

Last reviewed: 2026-10-01

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
└── React application root
    └── QueryClientProvider
        └── AuthSessionProvider
            └── RouterProvider
                └── App route layout
                    ├── Route outlet
                    │   ├── Public routes
                    │   │   ├── SignInRoute → SignInPage
                    │   │   └── OAuthCallbackRoute → OAuthCallbackPage
                    │   └── ProtectedRoute
                    │       ├── index → FlocksRoute → FlocksPage
                    │       ├── FlocksRoute → FlocksPage
                    │       ├── CreateFlockRoute → CreateFlockPage
                    │       └── FlockDetailRoute → FlockDetailPage
                    └── UpdatePrompt
```

The routed tree above is the composition that runs today. Product pages follow
the broader feature pattern below as they are added:

```text
Route controller
├── URL input, navigation, and document metadata
├── Domain hooks
│   └── Data-access modules
│       └── Supabase
│           Auth · Postgres · Realtime · Storage
└── Page with clean, typed props
    └── Page-scoped content
        ├── Shared components
        │   └── Reusable primitives
        └── Reusable primitives
```

The route controller is orchestration rather than rendered page content. It
starts remote work through a domain hook, translates the resulting state into
page props, and owns router-aware effects. The page and lower visual layers do
not reach sideways into the routing or data branches.

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

Local development uses a Just recipe as a thin orchestration layer. `just dev`
starts the Docker-backed Supabase stack, reads its current public API URL and
publishable key, and supplies only those values to the Vite process. The npm
scripts remain the canonical underlying commands for CI and environments
without Just. Local migrations and deterministic seed data are replayed
explicitly with `just reset`; ordinary startup preserves database changes.

### React Router

React Router owns client-side routes. Shareable invitation URLs and the OAuth
callback require real, addressable routes rather than screen state hidden in a
single component. Modules in `src/routes` are the highest feature layer and
initiate complete workflows; pages remain pure views of application-shaped
props.

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
routes → pages → components → primitives
```

### Primitives

Primitives are domain-neutral controls and indicators such as `Button`,
`TextField`, and `PendingIndicator`. They own consistent semantics, accessible
states, touch sizing, focus treatment, and visual variants. They do not know
about routes, flocks, Supabase, or data queries. Reusable SVG marks live in
`src/primitives/icons`; they remain dumb visual elements and default to
decorative semantics when a surrounding control already provides the
accessible name.

`Button` also owns the shared mutation-pending presentation. A caller supplies
an action-specific pending label while retaining ownership of the underlying
request state. The primitive disables duplicate activation, exposes busy
semantics and a polite status announcement, composes `PendingIndicator`, and
reserves both labels' geometry so progress never moves surrounding controls.

### Components

Components combine primitives into reusable interface patterns. For example,
`EmailSignInForm` validates and emits a normalized email address, while
`EmailOtpForm` validates a code and exposes verification and resend intent.
`SocialSignInButtons` exposes Google and Facebook intent, including disabled and
provider-specific pending presentation. They receive data and callbacks rather
than calling Supabase directly.

`FlockList` receives typed flock summaries and emits the selected flock
identifier. It owns accessible list and selection semantics but not fetching,
navigation, or empty-state copy. Long names remain fully readable on narrow
screens, and the route controller decides what selecting a flock means.

`CreateFlockForm` owns flock-name input, normalization, and the database-aligned
required and length validation experience. It emits a valid name and receives
pending, disabled, and safe error presentation through props. It does not call
React Query or Supabase, keeping mutation orchestration at the route layer.

### Routes

Route controllers live in `src/routes` and are registered by `src/router.tsx`
when their destinations are ready to expose. They read URL state, call workflow
or query hooks, own navigation and document metadata, and translate asynchronous
results into typed props and callbacks. Loading, authorization, not-found, and
recovery decisions stay here when they are route concerns rather than reusable
page presentation.

### Pages

Pages are router-agnostic screen views. They receive application-shaped data and
callbacks through typed props, assemble feature components and primitives, and
contain no React Router, React Query, or Supabase calls.

`FlocksRoute` calls `useFlocks`, translates React Query state into safe loading,
refreshing, empty, error, and populated page props, and owns navigation intent
for creation and flock selection. `FlocksPage` renders those props and remains
testable without a router or database. The protected router exposes the route
at `/flocks` and also renders it at the application index so authentication can
restore an exact root URL, including its query and hash.

`CreateFlockRoute` calls `useCreateFlock`, maps pending and failure state into
safe page props, and forwards normalized creation intent from the pure
`CreateFlockPage`. The page composes the shared `CreateFlockForm`, so validation,
input preservation, and duplicate-submit protection keep their established
owners. The live route at `/flocks/new` navigates to the returned flock's detail
URL only after creation succeeds. It replaces the completed form in browser
history so Back returns to the owning list.

`FlockDetailRoute` reads the flock identifier, calls `useFlock`, and maps the
detail query into loading, refreshing, safe failure, and not-found views around
the pure `FlockDetailPage`. A missing row and a row hidden by Row Level Security
both arrive as `null` and deliberately share the same not-found presentation.
The protected router exposes the route at `/flocks/:flockId` as the destination
for list selection and successful creation.

Pages stay in one file while their presentation remains easy to scan. When a
page grows, it moves into a domain-named directory with page-scoped feature
components. Route orchestration stays separately visible in `src/routes`.
Page-only pieces remain beside their page rather than entering `src/components`;
only behavior reused across pages is promoted.

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

`src/data/flocks.ts` owns the first product-data read. It selects a minimal
flock summary and does not accept or filter by a user identifier. The active
Supabase session supplies database identity, and PostgreSQL Row Level Security
determines which rows are visible. Query failures reject from the data layer so
React Query hooks can own cache and recovery behavior without exposing
Supabase calls to pages or components.

The same module can read one flock by identifier with `maybeSingle`. It returns
`null` when Row Level Security exposes no matching row, preserving the database
authorization boundary without teaching the client whether the row is absent
or merely inaccessible. `useFlock` caches that result under the established
detail query key.

The same module owns flock creation. The browser submits only the name;
PostgreSQL enforces its constraints, generates the identifier, and derives
`owner_id` from the active authenticated session. The insert returns the same
minimal flock-summary shape used by list consumers. The frontend does not accept
an owner identifier, which keeps ownership assignment inside the database
authorization boundary.

The shared Supabase client is parameterized by the generated `Database` type in
`src/types/database.ts`. That file describes only the exposed `public` schema
and is regenerated from the migration-built local database with
`npm run db:types`; it is committed for deterministic builds but never edited
by hand. Generated types provide compile-time table contracts, while Row Level
Security, constraints, and input validation remain the runtime authority.

React Query owns asynchronous server-state caching outside authentication. One
application-level `QueryClientProvider` wraps the router and session provider.
The client instance is created once at startup, so renders and route changes do
not replace the cache. Domain hooks in `src/hooks` will call data-access modules
and expose application-shaped query results to route controllers; pages,
components, and primitives receive data through props.

Query keys are defined centrally in `src/data/queryKeys.ts`. Each family begins
with a plural domain root and adds stable list or detail scopes, allowing a
mutation to invalidate either one record, all details, or the complete domain
without matching unrelated data. The initial client treats reads as fresh for
30 seconds and retries a failed read once. Writes do not retry automatically.
React Query's default focus refetch remains active so stale data can refresh
when a runner returns to a backgrounded PWA. Tests use a fresh isolated client,
disable retries, and retain cache entries for the life of the test mount.

`useFlocks` is the first product-data query hook. It binds `listFlocks` to the
shared flock list key and relies on the application query client for freshness,
retry, and request deduplication. The hook exposes query state rather than
converting it into page copy, allowing the route controller to own loading,
empty, failure, and success translation.

`useCreateFlock` binds the flock-creation data function to React Query mutation
state. A successful mutation invalidates the shared flock-list key so active
list consumers refetch the database-authorized result. The hook does not append
directly to cached arrays or duplicate pending and error state, keeping the
server response and React Query as the state authorities.

Async hooks expose React Query's complete state contract rather than returning
only successful data. Query-hook tests cover initial pending, populated and
empty success, failure, and feature-specific cache behavior. Mutation-hook
tests cover idle when meaningful, pending, success, failure, and cache
reconciliation. Route controllers translate those states into safe page props
and recovery actions.

## Flock and membership data

Postgres migrations are the source of truth for product data. The first model
contains `flocks` and `flock_members`. A flock has one canonical `owner_id`, and
the same user receives an `owner` membership from an after-insert trigger in the
same transaction. A partial unique index prevents a second owner membership.
Every other membership has the `member` role.

The explicit owner column makes ownership checks and account-deletion behavior
simple: the owner alone can update or delete a flock, and deleting the owner's
authentication record removes the flock and its memberships. Ownership transfer
is intentionally unsupported until it can be implemented as one database
transaction that changes both the flock and owner membership together.

Both public tables have Row Level Security enabled and explicit grants. Signed-
out users receive no table privileges. Signed-in users can create flocks. The
canonical owner can read the new flock immediately, while other users can read
only flocks and rosters where they hold membership. They cannot write the
membership table directly; future invitation and join operations must add a
narrow policy or database function with their own authorization tests.

Membership-backed read policies use a `security definer` helper in the private,
non-exposed schema. This avoids recursive policies on `flock_members`. The
function has an empty search path, fully qualified table references, restricted
execution privileges, and an index supporting its user-and-flock lookup.

Database behavior is tested below the frontend with transactional pgTAP tests.
The suite verifies schema protections, grants, owner creation, member and non-
member visibility, owner-only writes, the single-owner constraint, and cascading
membership cleanup.

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
honest document title and accessible status. When a session exists, the route
controller consumes the saved destination and replaces `/sign-in` with that
location, including after OTP verification publishes a new session. It falls
back to `/` when no safe destination exists. If the initial session check
fails, the route passes a safe recovery state to the page and keeps sign-in
available rather than exposing the provider error.

Google and Facebook use Supabase OAuth with PKCE and return through
`/auth/callback`. The data boundary accepts only Flock's approved `google` and
`facebook` provider identifiers and constructs the callback from the current
application origin. Supabase then redirects the browser to the provider. The
callback URL must be allow-listed in each Supabase environment; provider client
secrets remain in Google, Facebook, and Supabase configuration.

The hosted Google and Facebook integrations are configured and have completed
live end-to-end sign-in checks. Google Cloud owns Flock's OAuth consent screen,
non-sensitive `openid`, email, and profile scopes, test-user access, and web
client credentials. Meta owns the unpublished Flock app, its `public_profile`
and email permissions, app domains, exact Supabase redirect URI, app roles, and
credentials. Supabase stores both providers' server-side credentials and is the
only callback registered with either provider.

Provider credentials are operational secrets, not frontend configuration. They
must not appear in `VITE_` variables, committed files, screenshots, logs, or
documentation. Local Flock callback routes belong in Supabase's redirect allow
list because Supabase returns the completed flow to the originating PWA after
the provider callback. A production deployment must add its exact application
URL to that allow list and update provider release configuration before social
sign-in is opened beyond test users and app roles.

PKCE fits Flock because a PWA is a public client: browser JavaScript cannot
protect a fixed OAuth client secret. Supabase creates a fresh verifier in the
initiating browser and sends a derived challenge with the authorization
request. The callback receives a short-lived, single-use code, but Supabase will
issue a session only when that code is exchanged with the matching verifier.
This binds the exchange to the client instance that started it and makes a
captured authorization code insufficient on its own.

That binding creates an operational constraint as well as protection. The
callback must complete in the same browser and device where sign-in began.
Flock's initial design assumes one in-flight social sign-in per browser;
overlapping flows can be revisited with Supabase flow IDs if product usage
justifies the additional callback state.

The shared social sign-in component remains presentation-only. It names and
visually identifies both approved providers, preserves stable labels while a
redirect begins, and locks both choices once one provider is pending.
`SignInRoute` uses `useSocialAuthController` to translate those callbacks into data-layer calls,
prevents overlapping provider requests, and maps raw failures to provider-aware
recovery copy. The page disables email entry from the clean pending state it
receives and restores every method after a recoverable failure.

`OAuthCallbackRoute` captures the returned authorization code, immediately removes
callback parameters from browser history, and asks `useOAuthCallbackController`
to exchange the single-use code through the authentication data boundary. The
controller shares one request across React Strict Mode effect replays so it
cannot consume the code twice. A successful exchange consumes the saved
destination and replaces the callback route with it. Cancellation, missing
codes, interrupted connections, and rejected exchanges show safe recovery copy
without exposing provider details or consuming the intended destination.

`src/auth/destination.ts` owns intended-destination validation and per-tab
storage. It preserves the first valid internal path, including its query string
and hash, through an authentication redirect chain. Only paths beginning with a
single `/` are eligible; absolute URLs, protocol-relative URLs, backslashes,
surrounding whitespace, `/sign-in`, and `/auth/callback` paths are rejected.
The destination is consumed once after authentication and otherwise falls back
to `/`. `sessionStorage` survives a same-tab OAuth round trip without leaving a
stale cross-tab destination after the tab closes.

Sign-in restoration, protected-route preservation, and OAuth callback exchange
are implemented.
`ProtectedRoute` waits for initial session resolution before rendering private
content. A signed-out runner's complete location is preserved before the route
is replaced with `/sign-in`. Destination storage and navigation run in guarded
effects so render remains free of storage mutations and React Strict Mode
cannot repeat either one-time action during its development checks. OAuth
callback handling returns a completed social sign-in to the saved destination.

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

Page tests navigate to the real application and exercise routing, route-to-hook
wiring, mocked network boundaries, loading, recovery, and responsive layout.
They currently run as separate desktop Chromium, Android-sized Chromium, and
iPhone WebKit projects.

### Continuous integration

GitHub Actions reports static analysis, unit tests, component tests, page tests,
and the production build as distinct checks. The separation makes failures
easier to identify and allows independent jobs to run in parallel. Each browser
suite runs its desktop Chromium, Android-sized Chromium, and iPhone WebKit
projects in one job. This preserves project-labeled platform coverage while
installing the headless Chromium shell and WebKit only once per suite instead
of repeating checkout, dependency installation, and browser setup per device.

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

React Query owns reusable server-data queries and their cache lifecycle. Its
provider, query-key conventions, `useFlocks`, and `useCreateFlock` hooks are
established. Route controllers consume those domain hooks and keep React Query
state out of pure pages.

### Backend authorization

The first flock and membership tables have Row Level Security policies and
authorization tests. Every new operation must extend both explicit grants and
policies deliberately; hiding a control in the UI will never be treated as
authorization.

## A short explanation of the architecture

Flock is a React and TypeScript progressive web app built with Vite. React
Router gives the product real routes, Tailwind implements a token-driven design
system, and Supabase provides authentication and will provide the database and
realtime features. Route controllers own router-aware workflows, pure pages
render typed application props, presentational components collect user intent,
primitives enforce accessible interaction, hooks coordinate behavior, and data
modules isolate Supabase. Vitest checks logic quickly, while Playwright
checks components and complete pages in the browsers and phone sizes runners
will actually use.
