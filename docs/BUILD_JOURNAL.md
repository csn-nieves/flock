# Flock build journal

This journal records what happened while building Flock. It includes decisions,
hard points, fixes, and intentionally deferred work. The current architecture is
summarized in [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md); durable reasoning belongs
in [DECISION_LOG.md](./DECISION_LOG.md).

## 2026-09-29 — Establishing the product and technical foundation

### Product scope — PR #1

We reduced the larger vision to one usable membership slice: authenticate,
create a flock, share an invitation, join, and view members. Run events, maps,
paces, chat, discovery, notifications, payments, live tracking, and fitness
integrations remain outside this first slice.

This reduction matters because Flock could easily become several products at
once. The first slice tests whether organizers and runners benefit from having a
shared club identity and membership workflow before the project pays for maps,
realtime messaging, or native applications.

### Technical foundation — PR #2

We selected a React, TypeScript, and Vite PWA backed by Supabase and eventually
hosted on Cloudflare Pages. We documented Google, Facebook, and email as the
planned authentication methods.

The most important constraint was mobile delivery without prematurely taking on
Apple and Google store requirements. A PWA keeps one codebase and still allows
home-screen installation. The tradeoff is that browser and installed-PWA
behavior must be tested deliberately, especially on iPhone.

## 2026-09-29 — Building the frontend foundation

### React scaffold — PR #3

The repository gained React, Vite, strict TypeScript, ESLint, and Prettier. This
branch deliberately contained infrastructure rather than product UI so each
foundation could be reviewed independently.

### PWA shell and design system — PR #4

We added the manifest, service worker, mobile application shell, Tailwind, and
the first visual tokens. The brand moved to shamrock with a soft-white flight
formation of birds. An earlier symbol read too much like a flower or cannabis
leaf, so the mark was revised to communicate birds and forward movement more
clearly.

The shell respects safe-area insets and begins at a 360px viewport. We chose
true white rather than cream, avoided gradients, and used navy for accessible
text and focus. `DESIGN.md` became the durable explanation of those choices.

### Frontend hierarchy — PR #5

We documented the `pages → components → primitives` structure after discussing
how data should enter the UI. The rule is intentionally directional: dumb
primitives, mostly presentational components, and route-level pages that start
queries and mutations through explicit hooks or data modules.

This prevents a button or reusable form from quietly acquiring a Supabase
dependency and becoming difficult to test or reuse.

## 2026-09-29 — Establishing quality gates

### Unit testing — PR #6

Vitest and React Testing Library became the fast feedback layer. These tests
cover logic, component contracts, state transitions, accessibility attributes,
and cleanup without starting a full browser.

### Frontend CI — PR #7

GitHub Actions began running formatting, lint, typechecking, unit tests, and a
production build for every branch and pull request.

### Routing — PR #8

React Router was added before feature routes existed. This created the route
boundary needed for future invitation links and authentication callbacks while
keeping the initial home page intentionally empty.

### Button primitive — PR #9

The first reusable primitive established 44px touch targets, visible keyboard
focus, stable disabled behavior, and primary/secondary variants driven by
semantic tokens. This became the reference pattern for later controls.

### Browser component testing — PRs #10 and #11

Playwright was added with a lightweight story gallery that mounts components in
a real browser. The gallery initially looked like temporary demo infrastructure,
but its purpose became clearer: it is the component-test harness, not a product
screen. Redundant gallery-specific assertions were removed while the harness
was retained.

The browser matrix covers desktop Chromium, an Android-sized Chromium project,
and iPhone WebKit. The `@src` path alias was added so application and gallery
imports use the same stable source root.

### Split CI checks — PR #12

The original frontend workflow reported one large check. It was split so static
analysis, unit tests, browser tests, and builds report progress independently.
This improves failure diagnosis and allows jobs to run in parallel.

## 2026-09-29 — Designing authentication before wiring screens

### Authentication design — PR #13

We documented the flow before implementing it. Email uses a six-digit OTP, not
a password or magic link. The code stays inside the installed PWA, and the user
can see or change the submitted email while waiting. Google and Facebook will
use PKCE and return through `/auth/callback`.

We also recorded an open-redirect constraint: only same-origin relative paths
may be restored after authentication.

### Supabase browser client — PR #14

The client was configured with PKCE, persisted sessions, and automatic token
refresh. Startup validates the public project URL and publishable key so a
misconfigured environment fails with an actionable message.

A point of confusion was the `VITE_` prefix. Vite exposes every such variable to
browser code, so only Supabase's project URL and publishable key belong there.
Secret and service-role keys must never be placed in frontend configuration.

### Email OTP data layer — PR #15

We added focused functions for requesting and verifying email codes. Email is
trimmed and validated before a request, and verification explicitly uses
Supabase's `email` OTP type. The UI did not arrive in the same branch; the data
boundary was reviewed first.

### Session data and provider — PRs #16 and #17

The data layer gained session reads, auth-change subscription, cleanup, and sign
out. `AuthSessionProvider` resolves the initial persisted session and prevents a
late initial response from overwriting a newer auth event.

We explicitly expanded a shorthand object return involving `subscription`
because the longer form made the value's origin easier to follow. Readability
won over terseness.

A possible memory concern was raised around long-lived auth behavior. The
provider now unsubscribes and ignores updates after unmount, but production-like
memory profiling remains a watchpoint once protected-route redirects exercise
the lifecycle more heavily.

The Supabase dependency also pushed the production JavaScript above Vite's
500 kB warning. We documented route-level splitting as a future measured task
instead of hiding the warning or raising its limit.

## 2026-09-29 — Building email authentication from the bottom up

### TextField primitive — PR #18

The field primitive established visible labels, stable hint/error space,
`aria-describedby`, `aria-invalid`, mobile-safe sizing, and focus behavior.
Optional properties were placed after required properties to keep type contracts
easy to scan.

Spacing needed a visual correction: the focus ring sat too close to the helper
text. We increased the separation while preserving the field's stable feedback
area.

### Email entry form — PR #19

The first authentication component validates email locally, focuses the invalid
field, normalizes the submitted address, and remains independent from Supabase.
Server errors replace rather than stack with routine helper text, which keeps
the layout compact and the recovery guidance close to the field.

### OTP verification form — PR #20

The verification form follows the same presentational contract. It accepts the
email, code, errors, busy state, and callbacks as props. Error copy occupies the
same region as normal guidance, avoiding a large layout jump.

### Resend states and readability — PR #21

The OTP form gained a stable resend action, cooldown explanation, resending
status, recoverable error state, and mutual locking so verification, resend, and
email changes cannot race.

The first implementation used nested ternary expressions to choose status
content. That was difficult to scan, so it was replaced with explicit branches.
ESLint's `no-nested-ternary` rule now prevents the pattern project-wide. Existing
nested logic in `TextField` was cleaned up at the same time.

### Email authentication controller — PR #22

`useEmailAuthController` connected the form intents to the data layer without
rendering UI. It owns phases, pending flags, safe error translation, duplicate
request prevention, resend, and changing email.

The resend timer was implemented with an absolute deadline. A pure decrementing
counter can become incorrect when a mobile browser throttles a background tab;
recomputing from the deadline self-corrects when the page resumes.

React Query was deliberately not added. These actions are authentication
mutations, not reusable server-record queries. The plan is to introduce React
Query with the first flock-data query through a domain-specific hook.

### Sign-in page and page browser tests — PR #23

The `/sign-in` route now composes the email and OTP forms through the controller.
It adds Flock's existing mark, a route title, mobile-first spacing, and preserves
the email when moving backward.

Page-level Playwright projects were added separately from component projects.
Component tests answer whether a form behaves in isolation; page tests answer
whether the real route, controller, mocked network boundary, and responsive
layout work together. CI reports page and component failures separately.

The first CI run exposed an environment mismatch: local tests passed because a
developer `.env.local` supplied Supabase values, but CI had no such file. Unit
tests that imported the route and all three page-test servers failed immediately
with `Missing VITE_SUPABASE_URL`.

The correction was to commit `.env.test` with fake, non-secret values and start
Playwright's Vite server in `test` mode. The production missing-configuration
guard remains intact, local secrets stay ignored, and browser tests cannot send
OTP requests to the real Supabase project. After the fix, all unit, component,
desktop page, Android page, and iPhone page suites passed.

## 2026-09-29 — Centralizing custom React hooks

### Hook directory convention

The first authentication hooks originally lived directly in `src/auth`. That
location communicated their domain, but it did not provide one predictable
place to find React hooks as the application expands into user, flock,
membership, and event data.

We moved `useAuthSession` and `useEmailAuthController` into `src/hooks`, keeping
the controller's test beside it. Provider components and other authentication
infrastructure remain in `src/auth`, while direct Supabase operations remain in
`src/data`. Future React Query hooks will follow the same top-level hook
convention and pages will continue to initiate queries and mutations whenever
practical.

The directory will remain flat while it is easy to scan. Domain subdirectories
can be introduced inside `src/hooks` if hook volume or naming collisions create
a real navigation problem.

## 2026-09-29 — Making sign-in session-aware

### Session-aware sign-in route

The sign-in page now resolves `useAuthSession` before mounting the email
workflow. This prevents an authenticated runner from briefly seeing a form they
do not need and avoids initializing the email controller when the page will
immediately redirect.

While the provider resolves persisted state, the page keeps Flock's existing
shell and shows an accessible “Checking your session…” status with an honest
loading document title. A valid session replaces `/sign-in` with `/`, so the
Back button does not return the runner to an obsolete sign-in screen. The same
subscription-driven transition handles a session created after OTP
verification.

If the initial session read fails, the form remains usable and a page-level
notice explains the recovery path without displaying the raw Supabase error.
Focused page tests cover loading, recovery, and replacement navigation, while
Playwright seeds a fake persisted session to exercise the redirect in each
configured browser project.

Destination preservation remains intentionally separate. This branch always
uses `/` as the authenticated fallback.

## 2026-09-29 — Preserving authentication destinations safely

### Destination storage and validation

Protected routes and social sign-in need to remember where a runner was headed
before authentication. React state cannot survive a full OAuth redirect, while
`localStorage` can leave stale intent across tabs and later sessions. We chose
per-tab `sessionStorage`, which survives navigation away from and back to Flock
in the same tab and disappears when that tab closes.

`src/auth/destination.ts` now validates, preserves, and consumes this navigation
hint. A deeply nested path keeps its query string and hash. The first valid
destination wins so `/sign-in` and `/auth/callback` cannot overwrite the
original route during an authentication chain. Consumption removes the value
before returning it, preventing a later sign-in from replaying stale intent.

The validator accepts only internal paths beginning with one `/`. It rejects
absolute and protocol-relative URLs, backslashes, surrounding whitespace, and
the sign-in or callback route families. Invalid, missing, corrupted, or
unavailable storage falls back to `/`. This prevents open redirects but does
not grant access; route checks and Supabase authorization remain separate.

This branch intentionally stops at the utility boundary. No route guard,
sign-in redirect, or OAuth callback uses the stored destination yet.

## 2026-09-29 — Restoring the destination after sign-in

### Session-aware destination restoration

The sign-in page now consumes the saved destination as soon as it receives a
valid session, whether that session was already persisted or was just created
by email verification. Navigation replaces `/sign-in`, preserves the saved
query string and hash, and falls back to `/` when there is no valid value.

Destination consumption happens in a guarded effect instead of during render.
This keeps rendering free of storage mutations and prevents React Strict Mode's
development effect checks from consuming the one-time value twice. While the
effect completes, the page uses the existing sign-in layout to announce an
accessible returning state instead of briefly remounting the email form.

Unit coverage exercises the deep-location and fallback paths, including the
Strict Mode guard and replacement history. Page-level browser tests cover both
an existing session and a session created by OTP verification, and confirm that
the one-time storage value is removed after use.

Protected routes still do not write this destination. That route guard remains
a separate, reviewable branch.

## 2026-09-29 — Protecting private routes

### Session-aware route boundary

The application root now sits behind a reusable `ProtectedRoute` boundary,
while `/sign-in` remains public. The boundary waits for the initial Supabase
session check before rendering its child route, preventing private content from
flashing while authentication state is unknown.

When no session exists, the guard preserves the complete internal location and
replaces it with `/sign-in`. The preservation and navigation happen in a
guarded effect rather than during render, so React Strict Mode cannot repeat the
one-time action. The existing destination utility still owns validation,
first-valid-value behavior, and per-tab storage.

The sign-in layout was extracted into a presentational component so session
loading, protected-route redirection, and the sign-in workflow share one visual
and accessibility contract. Focused route tests cover loading, authenticated,
and signed-out states. The page-level OTP test now begins at a protected URL,
proving the full preserve, sign-in, consume, and return sequence in each browser
project.

## 2026-09-29 — Starting social authentication

### Google and Facebook OAuth data boundary

The authentication data module can now start Supabase OAuth for the two
approved social providers: Google and Facebook. It constructs a same-origin
`/auth/callback` URL and supplies it through `redirectTo`, allowing the existing
PKCE client configuration to carry the browser through the provider and back
to Flock.

We chose PKCE specifically because Flock's PWA cannot keep a client secret
confidential in browser JavaScript. Each sign-in receives a fresh verifier,
while only its derived challenge leaves the browser during authorization. A
returned code is useful only when exchanged with that verifier, which protects
the session if the code is intercepted. This also explains why the eventual
callback must run in the same browser and device that started sign-in.

Supabase stores the verifier locally. Multiple overlapping PKCE attempts can
compete for that local state, so the initial design assumes one social sign-in
at a time. We will adopt Supabase's flow-ID support only if multi-tab usage
makes that extra state necessary.

The exported provider type is intentionally narrower than Supabase's full
provider list. This keeps unsupported providers out of Flock's application
contract while leaving provider names and transport details outside future
presentational buttons.

Focused tests verify both providers and the callback URL. This branch does not
add buttons, initiate OAuth from the sign-in page, exchange the returned code,
or configure provider credentials. Those remain separate code and operational
steps.

## 2026-09-29 — Presenting social sign-in choices

### Google and Facebook button component

We added a shared, presentation-only component for Google and Facebook sign-in.
It reuses the canonical Button primitive and reports provider intent through
callbacks, so it has no Supabase dependency and can be exercised in isolation.
The provider marks live separately in `src/primitives/icons`, keeping reusable
visual primitives out of the larger authentication component. The redirect
spinner is also a domain-neutral `PendingIndicator` primitive so later pending
actions can reuse the same motion and visual treatment.

Both options have equal visual weight, stable “Continue with…” labels, and
recognizable provider marks. Provider colors stay inside those marks rather
than expanding Flock's palette. When one provider is opening, both buttons lock
to prevent overlapping PKCE attempts, the selected button shows progress
without changing size, and an accessible status names the provider.

Unit tests cover the callback and locking contract. Real-browser component
tests cover the same behavior and mobile touch geometry across desktop,
Android, and iPhone projects. Wiring these callbacks to the OAuth data boundary
remains a separate branch.

## 2026-09-29 — Integrating social sign-in

### Sign-in page and OAuth-start controller

The sign-in page now offers Google and Facebook before the six-digit email
option. A small `useSocialAuthController` hook connects those presentation-only
buttons to the OAuth data boundary, records which provider is opening, blocks a
second provider request, and translates failures into safe recovery copy.

Email and social authentication lock each other only while a request is active.
This prevents overlapping authentication attempts without removing email as a
fallback after Google or Facebook fails. A successful OAuth start deliberately
remains pending because the browser is leaving Flock; clearing it early could
briefly re-enable competing controls before navigation completes.

Unit tests cover provider-specific pending state, duplicate-request locking,
safe errors, and page wiring. Page-level browser tests verify that each button
navigates to the correct provider authorization URL with Flock's callback
across desktop, Android, and iPhone. Callback code exchange and provider-console
setup remain separate.

## 2026-09-29 — Completing the OAuth callback

### PKCE code exchange and destination restoration

The new `/auth/callback` page completes Google and Facebook sign-in by passing
the returned authorization code through a dedicated controller hook to the
Supabase data boundary. It removes callback parameters from browser history,
exchanges the code once, and replaces the callback route with the saved internal
destination after a session is created.

PKCE authorization codes are short-lived and single-use. React Strict Mode can
replay effects during development, so the controller retains one shared request
instead of starting an exchange per effect setup. This keeps development
behavior aligned with production and prevents a valid code from being consumed
twice.

Provider cancellation, a missing code, a connection interruption, and a
rejected exchange are recoverable states. The page removes raw provider details,
keeps the intended destination for a later attempt, and offers a clear return to
sign-in. Unit tests verify exchange ownership, Strict Mode deduplication, safe
errors, and navigation. Browser tests exercise loading, success, failure, and
cancellation across desktop, Android, and iPhone.

## 2026-09-29 — Connecting live social providers

### Google and Facebook provider configuration

Google and Facebook were configured against the hosted Supabase project and
verified through complete browser sign-in flows. Each provider redirects only
to Supabase's project-specific OAuth callback. Supabase then returns the browser
to Flock's allow-listed `/auth/callback` route, where the existing PKCE exchange
creates the application session. Successful Google and Facebook sign-ins both
returned to Flock and created the expected Supabase Auth users.

Provider credentials live only in Google Cloud, Meta for Developers, and
Supabase. They were transferred directly between provider dashboards and were
not added to source control, local frontend environment variables, or project
documentation. Flock's local Supabase URL configuration permits the exact
`localhost` and `127.0.0.1` callback routes used during development.

Google remains in testing mode with an explicit test-user list. The Meta app is
unpublished, so Facebook sign-in is limited to app roles. These restrictions
let the real integrations be exercised without presenting an unfinished app to
general users. Production release remains a separate decision that requires a
deployed domain and the providers' release requirements.

Meta's multi-value App Domains and Valid OAuth Redirect URIs controls were the
main setup difficulty. Typing a value and saving left text visible but did not
persist it. The value first had to be committed as a tag with Enter, then saved.
Meta's built-in redirect validator and a live OAuth attempt exposed the missing
persisted callback. After committing both the Supabase domain and exact callback
entry, the same live test completed successfully.

## 2026-09-29 — Establishing React Query conventions

### Server-state provider and query-key foundation

TanStack React Query now provides Flock's shared server-state cache. A single
application client wraps the router and authentication provider, preserving the
same cache across renders and navigation. This branch deliberately adds no
Supabase product query; it establishes the boundary before the first flock
workflow needs it.

Reads remain fresh for 30 seconds and retry once, balancing duplicate-request
avoidance with recovery from a brief mobile connection interruption. Mutations
do not retry automatically because repeating a write could duplicate an action.
The default focus refetch remains enabled so stale data can refresh when a
runner returns to a backgrounded PWA.

The first hierarchical query-key family establishes plural domain roots with
separate list and detail scopes. Future hooks will live in `src/hooks`, use
these keys, and call the Supabase-facing modules in `src/data`. Tests receive a
fresh client with retries disabled and a cache retained for the test mount,
preventing one test's server state or timers from leaking into another.

## 2026-09-29 — Establishing flock membership storage

### Flock and membership schema

The first product tables are now expressed as a migration rather than changes
made directly in the hosted dashboard. `flocks` stores the canonical owner,
while `flock_members` stores one owner membership and future member rows. The
owner membership is inserted by a database trigger in the same transaction as
the flock, and a partial unique index rejects a second owner.

Row Level Security starts closed. Anonymous users have no privileges. An
authenticated runner can create only a flock they own, members can read only
their shared flock and roster, and only the owner can update or delete the
flock. Direct membership writes are intentionally unavailable until invitation
and joining semantics exist. A private `security definer` helper avoids the
recursive policy that would result from asking `flock_members` to authorize a
query against itself.

Transactional pgTAP tests cover table security, least-privilege grants, atomic
owner membership, member and outsider visibility, owner-only writes, ownership
invariants, and cascade cleanup. The repository now includes the minimal local
Supabase configuration needed to apply migrations and run those tests. Docker
was not initially available, so the migration first passed a focused smoke test
against temporary PostgreSQL 17 with Supabase-compatible auth roles. Installing
Docker later enabled the complete local Supabase replay and exposed the policy
ordering issue documented below. Hosted deployment remains deliberately
separate.

## 2026-09-29 — Correcting owner visibility during flock creation

### Owner-aware flock read policy

The first full local pgTAP run exposed an ordering edge case that the earlier
PostgreSQL smoke test did not exercise. Creating a flock with `INSERT RETURNING`
also evaluates its select policy. That policy originally required the new flock
to appear in the caller's membership list, but the after-insert trigger creates
the owner membership later in the statement. PostgreSQL therefore rejected the
returned row even though the insert policy correctly recognized the owner.

A follow-up migration now lets the canonical `owner_id` satisfy the flock read
policy directly and retains the membership helper for every other member. This
matches the ownership model, makes flock creation compatible with Supabase's
normal insert-and-return pattern, and keeps non-members excluded. An owner index
supports the new policy and owner foreign-key operations. The existing pgTAP
creation assertion now guards this exact regression.

After the correction, a clean local reset replayed both migrations and all 27
pgTAP assertions passed.

## 2026-09-30 — Typing the Supabase data boundary

### Generated public-schema contract

The frontend Supabase client now consumes generated TypeScript definitions for
the migration-built `public` schema. Queries against `flocks` and
`flock_members` can therefore infer their row, insert, update, and relationship
shapes instead of treating product data as an untyped external response. This
branch deliberately adds no product query or React Query hook; it establishes
the contract those later branches will use.

`npm run db:types` regenerates the checked-in contract from the running local
database and formats the CLI output. Local generation keeps migrations as the
source of truth, works without hosted credentials, and prevents a remote
deployment's timing from deciding what the frontend compiles against. Only the
browser-accessible `public` schema is generated, so the private RLS membership
helper does not become part of the client surface.

The generated file is not hand-edited. A schema migration must be applied
locally before regeneration, and both changes must be reviewed together.
Because the membership role currently uses a PostgreSQL check constraint, its
generated TypeScript shape is `string`; the data layer must preserve that
runtime constraint until a future workflow demonstrates that a database enum
would provide enough value to justify a migration.

## 2026-09-30 — Reading visible flocks through the data boundary

### Typed flock summary query

The first product-data function now lists the flocks visible to the current
Supabase session. It requests only the identifier, name, and owner identifier
needed by a future flock list and returns the generated `FlockSummary` shape in
stable name order.

The function intentionally accepts no user identifier and adds no browser-side
ownership filter. PostgreSQL Row Level Security remains the authorization
boundary and decides which flock rows the authenticated session can read. This
prevents a missing or manipulated frontend filter from becoming a data leak.
Supabase query failures reject from the data module so the future React Query
hook can own retry, caching, and presentation-safe error behavior.

Focused unit tests cover the selected table and columns, ordering, an empty
authorized result, and error propagation. React Query integration and rendering
remain separate branches.

## 2026-09-30 — Caching the visible flock list

### React Query flock hook

`useFlocks` now connects the typed flock-summary data function to the shared
React Query cache. It uses the established flock list key, returns React
Query's standard pending, success, and error state, and contains no duplicate
request or presentation state of its own.

Multiple consumers using the hook at the same time share one in-flight request.
The application query client's existing freshness and retry policy applies
without being redefined inside the domain hook, keeping cache behavior
consistent across future flock screens. The hook leaves raw query failures for
the page boundary to translate into safe user-facing recovery copy.

Hook tests cover populated and empty successful results, failures, and
deduplication across simultaneous consumers. Page rendering and its loading,
empty, and recovery states remain a separate branch.

## 2026-09-30 — Presenting selectable flocks

### Mobile-first flock list component

`FlockList` is the first presentational component for product data. It receives
typed flock summaries through props, renders each flock as a semantic button,
and reports the selected identifier through a callback. It does not fetch data,
read React Query state, or own route navigation, preserving the boundary between
components and pages.

The list follows Flock's product-first visual system: flock names lead, rows use
borders and a subtle tonal interaction state instead of card shadows, and every
selection has a phone-friendly target. Long names wrap rather than becoming
hover-only truncated content. An empty array renders no list because the future
page owns the empty-state explanation and action.

Unit tests cover accessible list semantics, selection intent, and empty input.
Playwright verifies selection, touch geometry, long-name wrapping, and empty
rendering across desktop Chrome, Android-sized Chrome, and iPhone WebKit.

## 2026-09-30 — Removing duplicate feature-branch CI runs

### Main-only push validation

Frontend CI previously ran once when a feature branch was pushed and again when
its pull request was opened or updated. Both runs executed the same nine jobs
against the same commit, doubling feedback without adding meaningful coverage.

Pull requests remain the required pre-merge validation point. Push-triggered CI
now runs only on `main`, preserving a post-merge verification of the repository's
canonical branch while avoiding duplicate feature-branch runs. Job names remain
unchanged so the repository's required-status-check rules continue to match.

## 2026-09-30 — Creating a flock through the data boundary

### Typed flock creation

`createFlock` is the first product-data mutation. It accepts only a flock name,
inserts through the typed Supabase client, and returns the same minimal summary
shape used by the flock list. The browser does not provide an identifier or
owner identifier: PostgreSQL generates the flock ID and derives ownership from
the authenticated session.

Keeping ownership assignment in the database prevents a caller from selecting
another user as the owner and preserves the existing Row Level Security and
trigger-backed membership guarantees. Mutation failures reject from the data
module so the future React Query hook can own cache updates and the future page
can translate failures into safe recovery copy.

Focused tests verify the insert payload, returned summary, database-owned field
omission, and error propagation. React Query mutation state, validation UI, and
cache invalidation remain separate branches.

## 2026-09-30 — Coordinating flock creation with React Query

### Create-flock mutation hook

`useCreateFlock` connects the typed creation function to React Query's mutation
state. It exposes the library's standard pending, success, and error contract
instead of mirroring request state in component-local variables.

After creation succeeds, the hook invalidates the shared flock-list key. Active
list consumers can then refetch the complete database-authorized result in its
canonical order. This favors server reconciliation over manually appending to a
cached array, which would duplicate ordering and visibility assumptions in the
browser. The invalidation promise is awaited so creation remains pending until
active list refreshes have settled.

Focused hook tests cover the initial idle contract, mutation input and result,
pending behavior, failure exposure, and flock-list invalidation. This also
establishes a broader rule that query and mutation hooks receive explicit
coverage for their complete application-relevant async lifecycle rather than
only their successful result. Form validation, user-facing error copy, and
create-flow presentation remain separate branches.

## 2026-09-30 — Collecting a new flock name

### Presentational create-flock form

`CreateFlockForm` composes the shared `TextField` and `Button` primitives into
the first product-data form. It owns the flock-name value, trims surrounding
whitespace, validates the database's required and 80-character constraints,
and emits only valid submission intent. It remains unaware of React Query,
Supabase, routing, and post-create navigation.

The form uses app-owned validation with an associated inline error and first-
error focus. Pending state disables the field and action, announces creation to
assistive technology, and blocks duplicate submissions.
Safe server error copy replaces field guidance without clearing the entered
name, allowing correction or retry.

Stories and unit tests cover default, validation, recoverable failure, disabled,
and pending states. Playwright verifies the interaction and phone-sized action
geometry across desktop Chrome, Android-sized Chrome, and iPhone WebKit. No new
tokens were introduced because the established form primitives already own the
visual and accessibility contract.

## 2026-09-30 — Making pending actions explicit

### Shared button pending state

The canonical `Button` primitive now accepts request state and an
action-specific pending label. While work is active, it disables native button
interaction, exposes busy semantics, announces the update politely, and pairs
the visible progress label with the existing `PendingIndicator`. The
create-flock form now changes `Create flock` to `Creating flock` rather than
communicating progress only through a disabled control and hidden status.

Both the idle and pending contents participate in the same internal grid, with
only the current state visible. This reserves the larger geometry before the
request starts and prevents nearby controls from moving when a longer progress
label appears. The primitive stays domain-neutral because each caller supplies
its own verb-led copy; authentication actions remain a later, independently
scoped migration.

## 2026-09-30 — Presenting the flock collection

### Flocks page state model

`FlocksPage` is the first product page to consume cached database data. The
page calls `useFlocks`, translates React Query's request state into explicit
loading, error, empty, populated, and background-refresh presentations, and
owns the navigation intents produced by the view. `FlockList` remains focused
on collection presentation and selection, while the shared `Button` and
`PendingIndicator` primitives continue to own action and progress behavior.

Existing flocks stay visible during a background refresh so a routine cache
update does not replace useful content with a full-page loading state. Initial
loading reserves stable space, failures use safe recovery copy, and retry uses
the button's pending contract to prevent duplicate requests. Separating the
query-connected page controller, presentational `FlocksPageView`, and
page-scoped state content makes each responsibility easy to scan and every
state testable without coupling component stories to Supabase. This becomes the
page-organization pattern when a route outgrows a single readable file; simple
pages remain whole, and page-only pieces are not promoted into the shared
component layer prematurely.

The page is intentionally not exposed through the live router yet. Its create
and selection actions target `/flocks/new` and `/flocks/:flockId`, and neither
destination exists today. Keeping the page out of production navigation avoids
shipping controls that lead to missing screens; router exposure belongs in the
small branch that establishes those destinations.

## 2026-09-30 — Making development context portable

### Codex instructions and current-state handoff

Long development conversations eventually become expensive to navigate and can
make a new task harder to start. The repository now carries the context needed
to continue without relying on one conversation's history.

Root-level `AGENTS.md` records the durable collaboration and engineering rules
Codex must follow, including small branches, the no-commit/no-push boundary,
frontend ownership, state coverage, and proportional verification.
`docs/CURRENT_STATE.md` separately records the active milestone, completed
foundation, application boundary, next smallest branches, and known follow-ups.

Keeping those purposes separate avoids turning permanent instructions into a
status diary or allowing temporary status to masquerade as architecture. The
existing product, technical, design, decision, system-design, and journal
records remain authoritative for their own concerns; the handoff links to them
instead of duplicating their full rationale.

## 2026-09-30 — Separating routes from pure pages

### Explicit route-controller boundary

The frontend now uses an explicit `routes → pages → components →
primitives` feature hierarchy. Registered modules in `src/routes` own URL input,
navigation, document metadata, workflow hooks, and translation of async state.
Pages receive clean typed props and callbacks, so their rendering no longer
depends on React Router, React Query, or Supabase.

The previous code already separated some presentation into page views, but the
smart controller was still named `FlocksPage`, and authentication pages mixed
route effects with rendering. `FlocksRoute`, `SignInRoute`, and
`OAuthCallbackRoute` now make those responsibilities visible; `HomeRoute`
provides the same registration boundary for the simple protected index. Tests
that exercise navigation and hooks moved beside the routes, while component
stories continue to render pure pages directly. The user-visible behavior and
current membership milestone remain unchanged.

## 2026-09-30 — Connecting flock creation to server state

### Staged create route and pure page

`CreateFlockRoute` now connects the existing `CreateFlockForm` to
`useCreateFlock` and translates React Query mutation state into a small typed
page contract. `CreateFlockPage` owns only the screen layout and forwards valid,
normalized names upward; it remains unaware of React Query, Supabase, and
routing.

The route maps transport failures to safe recovery copy instead of exposing raw
database details. The shared form preserves the entered name, keeps app-owned
validation and first-error focus, and uses the canonical pending button to
prevent duplicate creation while the request is active. Component-browser
coverage exercises default, failure, and pending states at desktop, Android,
and iPhone sizes.

The route remains outside `src/router.tsx`. A successful creation will navigate
to its flock-detail destination, and that destination does not exist yet.
Deferring registration prevents an incomplete success path from becoming a
reachable product workflow; establishing the detail route remains the next
small branch.

## 2026-09-30 — Reducing repeated Playwright setup

### Suite-level browser jobs

Frontend CI previously expanded component and page browser coverage into six
fresh GitHub-hosted runners. The Pixel profile reused Chromium and the iPhone
profile reused WebKit, but every matrix entry still repeated checkout, `npm ci`,
operating-system dependency setup, and a browser download. Four jobs installed
Chromium and two installed WebKit even though the actual browser suites complete
quickly once their engines are available.

Component and page tests remain separate checks, preserving the useful failure
boundary between isolated stories and routed workflows. Each check now runs all
three Playwright projects in one runner and installs only the headless Chromium
shell plus WebKit once. Playwright's project names still identify desktop,
Android-sized, and iPhone failures in the job output, while CI setup falls from
six browser runners to two.

Browser binaries are intentionally not cached. Playwright's CI guidance notes
that restoring the large browser cache is often comparable to downloading it,
and Linux system dependencies still need installation. Sharding remains a
later option if test execution, rather than setup, becomes the measured
bottleneck. If repository branch protection requires the former per-device
check names, replace those requirements with the new `Component tests` and
`Page tests` checks before merging this workflow change.

## 2026-09-30 — Establishing the flock detail destination

### RLS-aware detail route and pure page

The first flock-detail destination now follows the complete frontend ownership
chain. `getFlock` selects one minimal flock summary, `useFlock` owns its React
Query cache state, `FlockDetailRoute` translates the route parameter and query
lifecycle, and the pure `FlockDetailPage` renders application-shaped props.

The data function uses `maybeSingle`, so a flock that does not exist and a flock
hidden by Row Level Security both become a successful `null` result. The route
presents one not-found state for both cases instead of revealing whether another
run club exists. Transport failures remain separate, use safe copy, and provide
a duplicate-safe retry; visible data stays in place during background refresh.

The route remains outside `src/router.tsx`. The next branch can now register the
list, create, and detail routes together and navigate a successful creation to
the returned flock identifier without exposing any incomplete destination.

## 2026-10-01 — Exposing the first complete flock workflow

### Protected list, create, and detail routes

The live router now exposes `/flocks`, `/flocks/new`, and
`/flocks/:flockId` beneath the existing session guard. The protected application
index also renders the flock collection, replacing the empty home placeholder
with the first usable product destination while preserving exact root URLs
restored after authentication. List actions now reach real create and detail
screens instead of staged test destinations.

Successful creation waits for the server-returned flock identifier and then
replaces the create route with that flock's detail URL. This keeps the mutation
pessimistic, prevents a guessed identifier, and makes browser Back return to the
owning list instead of reopening a completed form. React Query's existing list
invalidation makes the new flock visible when the collection mounts again.

A real-application Playwright flow covers the protected index, empty list,
create navigation, successful mutation, detail destination, Back behavior,
refetched list, and list-to-detail selection across desktop Chrome, Android-sized
Chrome, and iPhone WebKit.

## 2026-10-01 — Starting the complete local stack with one command

### Just orchestration and deterministic development data

Local development now has one explicit entry point: `just dev` starts the
Docker-backed Supabase services and then runs Vite against the public URL and
publishable key reported by that exact local stack. The values are scoped to
the Vite process instead of written into `.env.local`, so hosted configuration
cannot be mistaken for local configuration and private Supabase credentials do
not enter the browser environment.

The local seed creates two OTP-capable development accounts and three flocks,
including both owned and joined membership states. Supabase applies that seed
on first startup and on `just reset`; normal startup deliberately preserves
local changes. Just remains a convenience layer over npm scripts so CI and
contributors without it keep the same lower-level commands.

## 2026-10-01 — Creating single-use flock invitations

### Staged invitation creation and private token storage

Any current flock member can now create a cryptographically random invitation
that expires after 24 hours. The raw token is returned once for sharing while
only its SHA-256 hash is stored in a private database table. The schema records
consumption separately so the next branch can make acceptance single-use with
one atomic database operation. Multiple invitations for a flock are permitted;
each individual token is independently single-use.

The frontend follows the route-controller and pure-page boundary. A typed data
function and React Query mutation create the invitation, while a staged route
maps flock loading and mutation states into a mobile-first page. The generated
link remains selectable if clipboard access fails, and both creation and copy
actions block duplicate activation while pending.

The route is deliberately not registered in the live router yet. Its generated
URL points to an invitation-acceptance destination, so exposing creation before
acceptance would produce broken share links. The next branch should validate
and consume the token in the same database transaction that creates membership,
then expose the complete create-and-accept route pair.

## 2026-10-01 — Completing invitation acceptance and joining

### Atomic single-use acceptance and live invitation routes

Invitation links now complete the first usable join path. The acceptance
database function hashes the presented token, conditionally claims an unused
and unexpired invitation, and inserts membership in one transaction. PostgreSQL
row locking and the conditional update ensure concurrent runners cannot both
consume the link. Invalid, expired, and previously consumed tokens return the
same unavailable result so the interface does not reveal invitation history.

Once acceptance succeeds, every later call receives the same unavailable result
as an invalid or expired token—even when the caller is the runner who consumed
it. This strict behavior follows the product rule that use itself expires the
link rather than turning it into a durable membership credential.

The protected router now exposes invitation creation from flock detail and
acceptance at `/invitations/:invitationToken`. Signed-out recipients retain the
full invitation destination through sign-in. Authenticated recipients join
immediately, then the route replaces the token-bearing URL with the joined
flock detail page. Loading, unavailable, recoverable failure, retry, and narrow
mobile states are covered in the component gallery and routed browser tests.

## 2026-10-01 — Sharing flock invitations across devices

### Native share with copy recovery

Generated invitation cards now offer the operating system's native share sheet
when the browser supports it. The share payload names the flock and carries the
single-use URL, allowing mobile users to choose from the applications installed
on their device without adding vendor-specific integrations. Closing the share
sheet is treated as cancellation rather than a failure.

Copy remains visible on every platform, while clipboard failure continues to
focus and select the URL for manual copying. Share, cancellation, failure,
pending, copy, desktop, Android-sized, and iPhone states are covered through
the pure page story and route-controller tests.

Browser capability detection and Web Share calls remain in the route
controller; the page receives only typed callbacks.

## 2026-10-01 — Completing the first membership slice

### Flock-scoped public profiles and resilient member lists

Flock detail now shows an ordered roster with each runner's display name and
owner or member role. The roster query begins beside the flock query, and the
pure page keeps its member loading, empty, error, retry, background refresh,
and stale-refresh-failure states scoped to that section. A member-list failure
therefore does not replace an otherwise usable flock page.

Authentication emails remain private. A narrow public profile stores only a
display name synchronized from user metadata, with a neutral fallback, and Row
Level Security exposes it only to the runner and runners who share a flock. A
single security-invoker database function joins RLS-visible memberships and
profiles, avoiding both browser access to `auth.users` and one request per
member. Database tests cover grants, privacy, synchronization, roster ordering,
and outsider exclusion.

The deterministic local seed now includes three additional runners. Its flocks
exercise an owner-only roster, a two-person roster, and a five-person roster
with varied display-name lengths, so local development demonstrates the member
list without manual account setup.

This completes the create, invite, join, and view-members milestone. Visible
app-owned back navigation is the next focused usability branch so phone users
do not depend on browser chrome to leave nested screens.

## 2026-10-01 — Adding app-owned back navigation

### Deterministic parent routes for nested screens

Every nested flock screen now starts with one visible, labeled back control
that keeps the shared 44-pixel touch target across successful, loading,
not-found, and recoverable error states. Flock creation, detail, and invitation
acceptance return to the flock collection; invitation creation returns to the
owning flock.

The route controllers own these destinations and replace the current nested
entry. They deliberately do not replay raw browser history, because a direct
link or restored authentication flow may otherwise send a runner back to an
external page, sign-in, or the OAuth callback. Pages remain router-agnostic and
receive only back intent through typed props, while the shared component owns
the familiar arrow, label, focus behavior, and touch geometry.

Top-level flock collection and authentication handoff screens do not receive a
misleading generic back control. Their existing task-specific destinations
remain the appropriate recovery paths.

## 2026-10-01 — Profiling authentication lifecycle behavior

### Repeated route transitions and heap stability

The existing authentication lifecycle protections were profiled in a
production-like Chromium run before adding more auth code. A persisted test
session and mocked Supabase responses exercised ten repeated sign-in to
protected-route transitions, forcing garbage collection before each heap
sample. Used JavaScript heap stayed at 19.3 MB for every sample, and the run
reported no console warnings or errors.

The provider's existing unit coverage also verifies that its auth subscription
is unsubscribed on unmount and that a late initial session response cannot
update an inactive provider. OAuth callback coverage verifies that React Strict
Mode does not exchange a single-use authorization code twice. No lifecycle
change was warranted by this profile.

This is a Chromium, mocked-network, short-duration measurement—not a substitute
for long-lived token-refresh profiling or Safari/WebKit memory tooling. Those
remain release-level checks if authentication behavior changes materially.

## 2026-10-01 — Adding self-service runner profiles

### Profile editing at the route boundary

Runners can now open `/profile` from the flock collection, review their current
display name, and save a trimmed replacement. `ProfileRoute` owns the query,
mutation, navigation, retry state, and document title while `ProfilePage` and
`ProfileForm` remain router-agnostic. A security-definer function derives the
target from `auth.uid()` so the browser cannot update another runner's profile.

The mutation updates the profile cache and invalidates flock member lists so a
name change is reflected wherever the runner appears. The first slice keeps
profile scope deliberately narrow; richer identity, privacy controls, and
runner discovery remain deferred.

## 2026-10-02 — Inviting a whole flock to a personal event

### Snapshot-based recipient invitations

Personal-event creators can now choose one runner or a discovered flock as the
invitation audience. Selecting a flock expands its roster inside a reviewed
database function and creates one unique, recipient-bound link per current
member. The interface returns the named links as a batch so the creator can
copy or share each one without exposing a reusable audience-wide credential.

The expansion is deliberately a snapshot rather than a live membership rule.
Runners who join later are not silently added to an earlier event, and runners
who leave keep the invitation that was already issued to them. This preserves
the existing 24-hour expiration and strict single-use behavior without making
event access depend on mutable flock membership after creation.

The route controller owns discovery and invitation mutations while the page
and audience picker remain transport-agnostic. Database coverage verifies
authorization, exact roster expansion, unique token hashes, shared expiry,
recipient enforcement, replay rejection, and membership changes on both sides
of the snapshot. Distribution remains manual through each runner's private
link; notifications and dynamic audience management remain deferred.

## 2026-10-02 — Making flock event invitations live and visible in app

### Universal flock audiences with in-app acceptance

Whole-flock personal-event invitations now persist one flock audience instead
of expanding the roster. Eligibility follows current membership for the full
seven-day invitation window: later joins become eligible, departures lose an
unaccepted invitation, and an accepted runner keeps event and RSVP access if
they leave later. One optional link can serve every eligible member, with
acceptance recorded once per runner.

The Events screen now loads a separate invitation inbox with responsive
loading, failure, retry, pending, and acceptance states. Both live-flock and
recipient-bound invitations can be accepted in app, removing the requirement
for organizers to distribute every link manually. Creator-only controls remain
hidden when an accepted invitee views an event.

OS-level push notifications remain a separate branch because they require
user permission, one or more device subscriptions per runner, server-side push
delivery, subscription cleanup, and platform-specific PWA verification. The
in-app inbox is the durable source of truth that future push notifications can
deep-link into.

## 2026-10-02 — Delivering event invitation alerts across devices

### Standards-based Web Push with an in-app source of truth

Runners can now turn personal-event invitation alerts on or off for the browser
or installed PWA they are currently using. Permission is requested only after
the runner chooses the Settings action. The page distinguishes enabled,
disabled, blocked, unsupported, unconfigured, recoverable failure, and the
iPhone/iPad Home Screen prerequisite without making push a condition of using
the Events inbox.

Subscriptions are private, recipient-bound, and per device. Targeted invitations
queue their runner; universal flock invitations queue current members and also
queue runners who join while the invitation remains active. The delivery claim
rechecks membership, acceptance, cancellation, event time, and expiration
before exposing notification content. This preserves the live audience rule
when someone leaves after a job was queued.

The PWA now uses a custom Workbox service worker for both the existing app-shell
cache/update flow and Web Push. A guarded Supabase Edge Function signs encrypted
standards-based push messages with VAPID, sends them to every current device,
removes stale `404`/`410` endpoints, and deep-links notification clicks to the
Events invitation inbox. Hosted VAPID secrets, the public build key, deployment,
and the database webhook remain explicit release configuration rather than
secrets committed to the repository.

## 2026-10-02 — Giving superadmins global event controls

### Paginated review and cancellation

The protected admin dashboard now lists flock and personal events across the
application in server-sized pages. Each card identifies its creator, event
type, schedule, location, and lifecycle status, while URL-owned pagination
keeps the view linkable and bounds the amount of event data loaded at once.

Superadmins can cancel an upcoming event through a confirmation dialog. The
flow deliberately reuses the existing protected cancellation transaction and
keeps the event and attendance records intact; it does not introduce a second
admin-only destructive path. The mutation waits for server confirmation,
keeps recovery copy visible if the request fails, and refreshes both the admin
event view and the runner-facing event cache after success.

Unit, browser-component, route, and pgTAP coverage exercise pagination,
metadata, responsive layout, confirmation, recovery, and cancellation of a
personal event owned by another runner. Global membership controls remain the
next focused admin increment.

## 2026-10-02 — Giving superadmins global membership controls

### Protected member removal without ownership drift

The admin dashboard now lists every flock membership in server-paginated pages
that remain independent from event pagination. Each record identifies the
runner, flock, role, and join date. Ordinary members expose a confirmed removal
action; owner records explain why they cannot be removed from this workflow.

Removal is enforced by a new superadmin-only database function rather than a
direct table grant. It is safe to repeat after uncertain completion, rejects
owner removal, and leaves the runner account, flock, and personal events
intact. The interface waits for server confirmation, keeps failures inside the
dialog, announces success, and restores focus to the membership section.

Data, hook, route, page, browser-component, and pgTAP coverage verify paging,
role validation, owner protection, authorization, retry safety, responsive
layout, and success/failure behavior. The current planned admin operations are
complete; the next product milestone should follow organizer and runner
validation rather than speculative admin expansion.

## 2026-10-02 — Preparing real-user workflow validation

### A shared protocol before the next product milestone

The repository now contains one moderated study for the organizer, runner, and
internal admin workflows that Flock already supports. It defines participant
coverage, realistic goal-based tasks, platform preparation, privacy boundaries,
an outcome and severity scale, an anonymized session record, and the evidence
threshold for choosing follow-up work.

The lowest-friction setup uses three paired organizer-and-runner sessions, one
Cloudflare Pages preview, and one disposable Supabase project. Email-code sign-
in through a custom SMTP sender and the in-app invitation inbox are sufficient
for the first round; social OAuth, Web Push, a custom domain, and hosted
superadmin access stay outside the session environment until their added setup
answers a specific research question.

The protocol keeps automated verification separate from product validation. A
passing test suite can prove that the implementation follows its contract, but
only real organizers and runners can show whether the contract is useful and
understandable. Superadmin checks remain an internal operational exercise, so
participants never receive elevated credentials.

No user findings are claimed by this branch. The sessions must still be run
with at least three organizers and three runners, including iPhone and Android
coverage. Web Push delivery is marked not tested when a session environment is
not configured for it rather than being misclassified as a product failure.

## 2026-10-04 — Splitting secondary routes from application startup

### Static route matching with lazy implementations

Secondary route controllers now load through React Router's `lazy` route
contract. Paths remain declared synchronously, so direct links, protected-route
redirection, and saved authentication destinations keep their existing
behavior. Sign-in, OAuth callback, the protected shell, and the default flock
collection remain eager because they define startup and the most common landing
flow.

The production build changed from one 677.58 kB application bundle to a 368.96
kB entry chunk plus independent secondary-route and shared chunks. This removes
Vite's application chunk-size warning without raising its threshold. The
Workbox `inlineDynamicImports` deprecation warning remains unrelated and is not
hidden by this branch.

The PWA precache includes the generated route chunks, so installed clients can
still use them after caching. The improvement is primarily less initial parsing
and execution; route preloading remains deferred until navigation timing shows
a real need.

## 2026-10-06 — Exercising the invitation workflow across the real local stack

### One full-stack browser golden path

A dedicated desktop Chromium test now resets local Supabase, creates ordinary
signed sessions for two seeded users, and drives the personal-event flock
invitation workflow without REST mocks. The organizer creates the event and
universal flock invitation, the eligible runner accepts and responds, and the
organizer sees the persisted attendance after reloading.

The local secret key remains in the Node test process and is used only to mint
normal user sessions; Vite and the browser receive the public project
configuration and each user's session token. This exercises RPC wiring, Row
Level Security, persistence, and React Query refresh together while leaving
responsive browser coverage to the faster mocked page matrix. Human workflow
validation remains necessary because this test proves implementation behavior,
not whether runners and organizers understand it.

## 2026-10-06 — Adopting cohesive vertical-slice branches

### Complete one reviewable outcome without artificial layer boundaries

The repository workflow now favors reasonably sized, cohesive branches over a
series of very small layer-by-layer changes. One branch may carry the database,
data-access, application, UI, test, and documentation work needed to complete a
single outcome when those pieces belong together.

The review boundary remains strict: each branch must have one independently
reviewable purpose and must exclude opportunistic cleanup, unrelated refactors,
and separate product outcomes. The no-commit/no-push boundary is unchanged.
This adjustment reduces pull-request overhead and avoids incomplete
intermediate states while preserving focused reviews and understandable
history.

## 2026-10-06 — Extending full-stack coverage across the core flock workflow

### Membership and flock events through two real user sessions

The desktop Chromium full-stack suite now complements the personal-event
invitation journey with the product's original organizer-to-runner workflow.
An organizer creates a new flock and single-use invitation, a second seeded
runner joins through that link, and both sessions verify the persisted roster.
The organizer then creates a flock event, the runner sees it and responds, and
the organizer observes the persisted attendance after reloading.

Both journeys share one authenticated-browser helper that creates ordinary
local user sessions server-side and keeps the secret key out of Vite and the
browser. Each page also collects console warnings, console errors, and uncaught
page errors so a visually successful flow cannot hide a runtime problem. The
suite remains desktop-only and focused on frontend-to-database integration;
responsive and failure-state coverage stays in the faster mocked browser
matrix, and real participants remain necessary for usability evidence.

## 2026-10-06 — Completing flock identity details

### Name, location, description, and owner editing

Flock creation now fulfills the original product contract by collecting a
recognizable name, coarse location, and short description through one reusable
create/edit form. Flock lists show location, detail screens present the full
identity, and only the canonical owner receives the edit action. Updates wait
for PostgreSQL confirmation, refresh the detail cache and flock lists, preserve
draft values after recoverable failures, and announce success in the owning
screen.

The public `flocks` table gained constrained nullable location and description
columns. Nullable storage preserves honest unknown values for records created
before the migration, while the new product form requires both for every new or
edited flock. Existing Row Level Security remains the authorization boundary;
the browser never supplies an owner identifier. Deterministic seeds now give
all ten local flocks varied locations and descriptions, and full-stack coverage
creates and edits those values through the rendered workflow.

## 2026-10-06 — Extending event alerts to flock activity

### Flock event creation, updates, and cancellation

The existing per-device Web Push setting now covers meaningful flock-event
changes as well as personal-event invitations. Creating, changing, or canceling
a future flock event records immutable activity and creates one recipient job
for each current flock member other than the actor. Delivery rechecks live
membership, skips departed members, sends to every device currently registered
for an eligible runner, and deep-links into the flock event section.

Flock activity intentionally uses a point-in-time audience: runners who join
later receive future changes but not historical alerts. A superadmin
cancellation includes every current member, including the owner, because the
administrator is outside the audience. No-op edits do not create noise, and a
newer update or cancellation suppresses an older undelivered create/update
alert for the same event.

The invitation-only queue and Edge Function were generalized to
`private.notification_jobs` and `send-push-notification`. The in-app Events and
flock-detail views remain authoritative; this change does not add an alert
history, badges, WebSockets, chat notifications, delivery retry scheduling, or
hosted deployment configuration.

## 2026-10-06 — Binding flock attendance to run options

### Organizer-defined distance and pace choices

Flock owners now define one to eight distance-and-pace options while creating
or editing an event. Runners choosing “I’m in” or “Maybe” select the plan they
intend to join, and the event card shows attendance grouped by option while
retaining the overall in/maybe/out totals. Choosing “I’m out” clears the
selection. Personal events retain their simpler RSVP model.

The database writes an event and its complete option set atomically, limits
option reads through event-aligned Row Level Security, and verifies that an RSVP
option belongs to the target event. Stable identifiers preserve responses when
labels change. Removing an option keeps the attendance record but clears the
reference, making an earlier response visibly need a new choice. Existing
events with no options stay valid instead of receiving invented values, while
editing one requires the organizer to add current options.

The existing alert path treats option changes as material event updates. The
full-stack flock journey now creates two choices, has a second real user select
one, and verifies the grouped persisted result after the organizer reloads.
Transactional database coverage includes validation, authorization, RLS,
selection clearing, option removal, and backward compatibility.

## 2026-10-06 — Replacing free-text run options with structured pickers

### Unit-aware distance and pace choices

Flock event forms now use an authored, touch-first wheel instead of asking an
organizer to type distance and pace labels. The dark multi-column control keeps
the selected row centered, fades neighboring values, supports inertial touch
scrolling, and exposes keyboard-operable spin controls. Distance supports
tenth-unit steps. One shared miles-or-kilometers choice governs both distance
and pace, preventing mismatched units. Pace supports five-second steps from
4:00–15:00 per mile or 2:30–9:30 per kilometer, and changing measurement keeps
the closest equivalent effort.

The database now validates one shared unit with both numeric values, stores it
on the existing distance and pace columns under an equality constraint, and
derives concise labels for display and compatibility. Earlier
free-text rows remain readable instead of receiving guessed values. Editing an
older option shows its previous label and moves it into the structured model
only when the organizer saves reviewed values. Creation, editing, notification
change detection, generated database types, database tests, component tests,
and the full-stack flock journey use the same structured contract.

Personal events now use that same contract rather than retaining a separate,
less expressive RSVP path. Their create and edit forms use the wheel, invited
runners choose a specific plan for “I’m in” or “Maybe,” and the personal events
screen groups attendance by distance and pace. Database creation, updates,
authorization, and option validation remain transactional for both event
audiences.

## 2026-10-07 — Adding mapped event routes

### Privacy-minimized GPX courses for every event audience

Personal and flock event creators can now attach one optional GPX course to
each distance-and-pace option. Import happens in the browser, where Flock keeps
the longest usable line, calculates distance, and reduces large tracks to a
bounded coordinate set. The original file and its filename, timestamps,
elevation, author, and device metadata never enter application storage.

The route geometry and distance are written atomically with the rest of the run
option. Database validation rejects incomplete, malformed, oversized, or
out-of-bounds geometry, while existing event-aligned Row Level Security keeps
the precise line hidden from unauthorized users. Both event surfaces use one
shared option presentation and map dialog, and editing supports route
replacement or removal without disturbing the option's stable identifier or
attendance.

MapLibre GL JS renders against OpenFreeMap's hosted Liberty style. Its renderer,
worker, and map CSS are demand-loaded and excluded from PWA precaching so the
feature does not add a large install download for runners who never open a map.
The public basemap has no application-specific uptime guarantee; normalized
route storage deliberately remains provider-neutral so a later provider change
does not require a data migration.

## 2026-10-07 — Drawing road-following event routes

### Provider-backed drafts, provider-neutral events

Personal- and flock-event creators can now open a map beside any run option and
place ordered points without preparing a GPX file. Each point after the first
asks Geoapify for a shortest walking segment from the previous point, shows the
estimated combined distance, and keeps Undo and Clear local. Pointer placement
has a keyboard alternative through MapLibre panning plus an explicit
add-at-center action. A best-effort lookup starts near the entered event
location without blocking route creation when no match is found.

The routing and geocoding calls live behind a cancellable domain hook and data
adapter. Provider errors retain the accepted draft and offer retry through
another point; a missing public key leaves GPX import available. Completed
drafts reuse the existing bounded `EventRoute` contract, so no migration was
needed and saved events contain no waypoints, directions, provider identifiers,
or geocoding results. Map rendering remains demand-loaded and excluded from the
PWA precache.

## 2026-10-07 — Saving routes for future events

### Private route libraries with copy-safe reuse

Runners can now save a drawn, imported, or reused course under a private name,
preview it later, and copy it into either a personal or flock event. The same
library surface also supports rename and confirmed deletion. Only the selected
route mounts a map, keeping the wide desktop picker useful without multiplying
the map-rendering cost; phone layouts retain the existing compact map height.

The database owns route geometry validation and derives ownership from the
authenticated session. Browser clients receive owner-only reads through Row
Level Security and use protected functions for creation, rename, and deletion.
Library entries and event routes are independent copies, so cleanup cannot
silently rewrite existing event plans. Deterministic seed routes keep local UI
development representative without adding provider-specific data.

## 2026-10-07 — Repeating event plans

### Independent occurrences through the existing create workflow

Personal-event creators and flock organizers can now open a prefilled planning
form from an existing event. The title, location, description, structured run
options, own-pace choices, and copied route geometry carry forward, while the
date stays empty so the organizer must choose the new schedule.

The repeat mapper deliberately omits event and run-option identifiers and has
no access to invitations, responses, attendance, or cancellation state. The
submitted draft travels through the existing create mutation, so authorization,
atomic option writes, query refresh, and post-creation notification behavior do
not gain a parallel path. Personal and flock surfaces share the same mapping,
wide form, retry behavior, and phone-safe action hierarchy; no database change
was required.

## Current next steps

See [`CURRENT_STATE.md`](./CURRENT_STATE.md) for the maintained handoff and next
recommended branches. This journal remains chronological rather than carrying a
second status snapshot that can drift.

## Journal entry template

```md
## YYYY-MM-DD — Short milestone name

### Change — PR

What changed and which user or engineering problem it addressed.

Why this approach was selected, including meaningful alternatives.

What was difficult or surprising, how it was diagnosed, and how it was fixed.

What remains deferred, risky, or worth measuring later.
```
