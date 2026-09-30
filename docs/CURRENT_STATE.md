# Flock current state

Last reviewed: 2026-09-30

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
  component browser tests, page browser tests, and database tests.
- Supabase authentication through six-digit email codes, Google OAuth, and
  Facebook OAuth using PKCE, protected routes, safe destination restoration,
  and a dedicated callback route.
- Local Supabase development, migrations, generated frontend database types,
  Row Level Security, ownership and membership constraints, and transactional
  pgTAP coverage.
- React Query provider, query-key conventions, typed flock read and create data
  functions, `useFlocks`, and `useCreateFlock`.
- Presentational `FlockList` and `CreateFlockForm`, including complete async and
  validation states.
- Explicit route controllers in `src/routes` keep URL state, navigation,
  document metadata, and workflow hooks out of pure typed pages.
- A mobile-first `FlocksRoute`, pure successful `FlocksPage`, and pure
  route-state views covering loading, error, retrying, empty, populated, and
  background refresh.

## Current application boundary

The live router currently exposes sign-in, the OAuth callback, and the protected
home shell through explicit route-controller modules. `FlocksRoute` is
intentionally not registered yet because its create and detail actions do not
have complete destinations.

The hosted OAuth providers remain restricted to development/test access until
Flock has a deployed production domain, privacy policy, data-deletion process,
production branding, and a release candidate suitable for provider review.

## Next smallest branches

1. Build a query-connected create-flock route and pure page from
   `CreateFlockForm` and `useCreateFlock`, including safe mutation failure and
   pending behavior. Keep it out of the live router until its success
   destination is valid.
2. Establish the first flock-detail destination.
3. Wire the flock list, create, and detail destinations into one honest routed
   workflow.
4. Continue the membership slice with invitation creation, invitation
   acceptance, joining, and the member list in separate small branches.

## Known follow-ups

- Run production-like authentication lifecycle and memory profiling before
  treating the auth foundation as finished.
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
