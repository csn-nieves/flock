# Flock current state

Last reviewed: 2026-10-01

This is the short handoff snapshot for starting a new development task. It does
not replace the product, technical, design, decision, or system-design records.
Always inspect the current Git branch and working tree because they may contain
work newer than this file.

## Current milestone

Flock is building the first usable membership flow: authenticate, create a
flock, invite another runner, join the flock, and view its members. Events,
routes, pace groups, chat, discovery, notifications, and monetization remain
outside this slice.

## Completed foundation

- Mobile-first React, TypeScript, Vite, Tailwind, and installable PWA shell.
- Shared design tokens, primitives, component stories, Vitest coverage, and
  Playwright projects for desktop Chrome, Android-sized Chrome, and iPhone
  WebKit.
- CI checks separated by formatting, linting, types, unit tests, build,
  component browser tests, page browser tests, and database tests. Component
  and page jobs each run the complete desktop, Android-sized, and iPhone
  Playwright matrix without repeating runner setup per device.
- Supabase authentication through six-digit email codes, Google OAuth, and
  Facebook OAuth using PKCE, protected routes, safe destination restoration,
  and a dedicated callback route.
- Local Supabase development, migrations, generated frontend database types,
  deterministic seed data, a `just dev` full-stack startup, Row Level Security,
  ownership and membership constraints, and transactional pgTAP coverage.
- React Query provider, query-key conventions, typed flock read and create data
  functions, `useFlocks`, and `useCreateFlock`.
- Presentational `FlockList` and `CreateFlockForm`, including complete async and
  validation states.
- Explicit route controllers in `src/routes` keep URL state, navigation,
  document metadata, and workflow hooks out of pure typed pages.
- A mobile-first `FlocksRoute`, pure successful `FlocksPage`, and pure
  route-state views covering loading, error, retrying, empty, populated, and
  background refresh.
- `CreateFlockRoute` and pure `CreateFlockPage` connect
  `CreateFlockForm` to `useCreateFlock`, preserve entered data after a safe
  mutation error, and prevent duplicate creation while pending.
- `FlockDetailRoute` and pure `FlockDetailPage` load one RLS-visible
  flock by route identifier and cover loading, refresh, not-found, failure, and
  retry states without disclosing hidden flocks.
- Flock detail loads an ordered member roster with display names and owner/member
  roles. The member section independently covers loading, empty, failure,
  retry, populated, background refresh, and stale-data recovery while keeping
  the flock page usable.
- Public profiles contain only display names, stay synchronized from
  authentication metadata, and are readable only by authenticated runners who
  share a flock. Member emails remain private in Supabase Auth.
- Deterministic local data includes owner-only, two-person, and five-person
  rosters with varied display-name lengths for member-list development.
- Any flock member can create an opaque invitation that expires after 24 hours.
  Private storage keeps only its token hash, and the generated link supports
  native device sharing when available, copy fallback, and manual-copy
  recovery.
- Invitation acceptance atomically consumes the token and creates membership.
  No runner—including the original recipient—can use it again afterward.
- The protected live router exposes `/flocks`, `/flocks/new`,
  `/flocks/:flockId`, `/flocks/:flockId/invitations/new`, and
  `/invitations/:invitationToken` as one complete create, invite, and join
  workflow.
- Every nested flock page exposes a labeled, touch-sized back control in all
  route states. Route controllers use deterministic parent destinations rather
  than raw browser history, so direct links and restored auth flows have a safe
  fallback.

## Current application boundary

The live router exposes sign-in, the OAuth callback, and the protected flock
workflow through explicit route-controller modules. The protected index and
`/flocks` both render the flock collection; list actions reach `/flocks/new`
and `/flocks/:flockId`. Successful creation replaces the completed form route
with the returned flock detail destination. Visible app-owned back controls
return create/detail pages to the collection, invitation creation to its flock,
and invitation acceptance to the collection. These actions replace the current
nested entry and do not depend on browser history, which may contain an
external site or an authentication callback.

The hosted OAuth providers remain restricted to development/test access until
Flock has a deployed production domain, privacy policy, data-deletion process,
production branding, and a release candidate suitable for provider review.

Signed-out invitation recipients preserve the complete link through sign-in.
Once authenticated, acceptance joins them immediately and replaces the
token-bearing URL with the returned flock detail destination. Invalid, expired,
and already-consumed invitations share one non-disclosing unavailable state.
Invitations remain a convenient path into a flock, not an invitation-only
privacy gate; flock discovery remains deferred.

## Next smallest branches

1. Run production-like authentication lifecycle and memory profiling before
   treating the authentication foundation as finished.

## Known follow-ups

- Revisit route-level code splitting as the application grows; the current
  production build reports a JavaScript chunk above Vite's 500 kB warning.
- Expand the current visual foundation into a broader component design system
  only after enough real screens exist to reveal repeated product needs.
- Extract a reusable authenticated-PWA starter only after the first complete
  Flock workflow proves the authentication and application conventions.

## Restart checklist

For a new Codex task:

1. Read `AGENTS.md` and this file.
2. Read the source documents relevant to the next branch.
3. Inspect `git status`, the active branch, recent commits, and existing tests.
4. Confirm the next change is still the smallest honest product increment.
5. Create a focused branch and preserve the no-commit/no-push rule.
