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

## Current next steps

Authentication still needs:

- safe intended-destination storage and restoration;
- protected-route behavior;
- Google and Facebook provider configuration and buttons;
- `/auth/callback` PKCE exchange and recovery states; and
- production-like auth lifecycle and memory profiling.

The first product-data work should introduce React Query conventions, then move
into the flock creation, invitation, joining, and member-list slice.

## Journal entry template

```md
## YYYY-MM-DD — Short milestone name

### Change — PR

What changed and which user or engineering problem it addressed.

Why this approach was selected, including meaningful alternatives.

What was difficult or surprising, how it was diagnosed, and how it was fixed.

What remains deferred, risky, or worth measuring later.
```
