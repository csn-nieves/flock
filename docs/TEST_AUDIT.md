# Test coverage audit

Last reviewed: 2026-10-02

This audit compares production modules with committed Vitest and Playwright
tests. A missing same-name test is a useful signal, not proof that behavior is
uncovered: some pages are exercised through route or browser tests. The list
below prioritizes user-visible risk and authorization boundaries.

## Priority 0: cover before the next feature merge

These are recent workflows with no direct frontend coverage or only partial
coverage:

- `src/pages/EventsPage.tsx` and `src/routes/EventsRoute.tsx`: loading, empty,
  refresh, create modal, mutation failure, and successful creation.
- `src/hooks/useUserEvents.ts`, `useCreateUserEvent.ts`, and
  `useCreateEventInvitation.ts`: query keys, invalidation, success, and error
  states.
- `src/data/events.ts`: personal-event reads, event creation, RSVP mapping,
  and unexpected RPC response shapes.
- `src/data/profiles.ts`: profile read and update mapping/error behavior.
- `src/components/EventForm.tsx`: required fields, date conversion, draft
  preservation, pending state, and edit/create variants.
- `src/routes/AcceptEventInvitationRoute.tsx` and its page states: success,
  unavailable, retry, missing token, and navigation replacement.

The audit branches add coverage for the personal events page, event form,
personal-event hooks, modal behavior, profile form and data functions, event
data mapping, settings, section navigation, and event invitation data, hook,
and acceptance route. Remaining gaps are lower-risk shell navigation and some
event mutation resilience paths.

## Priority 1: shared interaction and navigation coverage

- `src/components/Modal.tsx`: focus placement/restoration, Escape dismissal,
  accessible labelling, and danger tone.
- `src/components/AppShell.tsx`: desktop navigation, mobile menu open/close,
  Escape, profile/settings links, and active state.
- `src/components/ProfileForm.tsx` and `src/pages/ProfilePage.tsx`: validation,
  save errors, pending state, and saved confirmation.
- `src/pages/SettingsPage.tsx` and `src/routes/SettingsRoute.tsx`: route
  rendering and settings navigation behavior.
- `src/components/FlockSectionNav.tsx`, `MemberRoleGroup.tsx`, and
  `MemberRosterHeader.tsx`: semantic labels and responsive member controls.

## Priority 2: pure page-state and resilience coverage

Add focused component tests where browser tests do not already assert the
contract:

- `FlockEventsSection`, `FlockMembersSection`, and `FlocksPageContent`.
- Invitation link sharing/copy fallback states.
- `UpdatePrompt` and `AuthPageLayout` interaction behavior.
- `useAuthSession`, event mutation hooks, and profile mutation hooks.

## Intentional exclusions

- Generated database types, static token files, and test helpers do not need
  behavior tests.
- Icon-only presentational files are covered through their consuming controls;
  add direct tests only when they gain behavior.
- `main.tsx` and CSS token files should be checked by build/browser smoke tests,
  not unit tests.

## Test policy for future branches

Every feature branch should include, as applicable:

1. Data-function tests for RPC/query mapping and error translation.
2. Hook tests for query keys, invalidation, and mutation lifecycle.
3. Component tests for validation, pending, error, empty, and success states.
4. Route tests for URL input, navigation, document title, and safe recovery.
5. Playwright coverage for changed interactive behavior at desktop, Android,
   and iPhone sizes.
6. Database tests for migrations, RLS, RPC privileges, and authorization.

The audit is complete when each Priority 0 item has a test or an explicit
documented reason for being covered indirectly.
