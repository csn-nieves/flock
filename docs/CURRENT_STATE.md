# Flock current state

Last reviewed: 2026-10-06

This is the short handoff snapshot for starting a new development task. It does
not replace the product, technical, design, decision, or system-design records.
Always inspect the current Git branch and working tree because they may contain
work newer than this file.

## Current milestone

Flock has completed its first usable membership flow and now supports the
initial personal-event invitation workflow, including opt-in Web Push delivery
for invitations and flock-event changes. Superadmins can now review and cancel
global event records and remove ordinary members from any flock. The current
planned admin operations are complete. Run events now carry organizer-defined
distance and pace options, and attendance is tied to a runner's selected plan.
A moderated workflow-validation protocol still gates the next product
milestone. Mapped courses, chat, and monetization remain outside the current
slice.

## Completed foundation

- Mobile-first React, TypeScript, Vite, Tailwind, and installable PWA shell.
- Shared design tokens, primitives, component stories, Vitest coverage, and
  Playwright projects for desktop Chrome, Android-sized Chrome, and iPhone
  WebKit.
- Repository checks are separated by formatting, linting, types, unit tests,
  build, component browser tests, page browser tests, full-stack browser tests,
  and database tests. Component and page CI jobs each run the complete desktop,
  Android-sized, and iPhone Playwright matrix without repeating runner setup
  per device.
- Dedicated desktop Chromium full-stack journeys reset local Supabase and
  verify flock creation, single-use joining, roster refresh, flock-event
  visibility and RSVP, and personal-event flock invitations across two real
  seeded sessions, including RPCs, Row Level Security, persistence, and query
  refresh.
- Supabase authentication through six-digit email codes, Google OAuth, and
  Facebook OAuth using PKCE, protected routes, safe destination restoration,
  and a dedicated callback route.
- Local Supabase development, migrations, generated frontend database types,
  deterministic seed data, a `just dev` full-stack startup, Row Level Security,
  ownership and membership constraints, and transactional pgTAP coverage.
- React Query provider, query-key conventions, typed flock read and create data
  functions, `useFlocks`, `useCreateFlock`, and owner-authorized flock profile
  updates through `useUpdateFlock`.
- Flock creation collects a name, coarse location, and short description.
  Owners can edit those details from flock detail, members can read them, and
  flock lists expose location so similar groups remain distinguishable.
- Presentational `FlockList` and reusable `FlockDetailsForm`, including complete
  async, validation, create, and edit states.
- Explicit route controllers in `src/routes` keep URL state, navigation,
  document metadata, and workflow hooks out of pure typed pages.
- Authentication, the application shell, and the default flock collection load
  eagerly; secondary route controllers load on demand through React Router so
  they do not inflate the initial application chunk.
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
- Flock rosters also show a runner's optional coarse city or region when one is
  available, while omitting unset locations cleanly.
- Public profiles contain only display names, stay synchronized from
  authentication metadata, and are readable only by authenticated runners who
  share a flock. Member emails remain private in Supabase Auth.
- Authenticated runners can edit their own display name through the protected
  `/profile` route; the page remains pure while its controller owns query,
  mutation, navigation, and document state.
- Profiles also support an optional coarse city or region location, with no
  precise coordinates or street-address storage.
- Flock members can view upcoming events, and flock owners and personal-event
  creators can create and edit events with a title, date/time, location,
  description, and one to eight
  structured distance-and-pace run options. A touch-first multi-column wheel
  replaces free-text option labels; one miles-or-kilometers setting governs
  both distance and pace. Distance supports tenth-unit steps, while pace
  supports five-second steps from 4:00–15:00 per mile or 2:30–9:30 per
  kilometer. Runners choose an option with “I’m in” or
  “Maybe,” attendance is grouped by option, and “I’m out” clears the choice.
  Pre-existing events and earlier free-text options remain readable until an
  organizer edits them into the current model.
- Authenticated runners can open `/events` from the application navigation,
  view their upcoming personal events, create a user-owned event through a
  reusable modal form, and use the same structured run-option picker and
  response-bound attendance model as flock events.
- User-owned events now have seven-day invitation tokens, an
  authenticated acceptance route, and RSVP authorization for invited runners.
- Personal event owners can generate invitation links from `/events`, share
  them through native device sharing when available, or copy them manually.
- Personal event invitees can see attendance counts and respond with “I’m in,”
  “Maybe,” or “I’m out” from the personal events view.
- Personal event attendance reads now include responses from event owners and
  accepted invitees, so RSVP counts reflect persisted responses.
- Personal event creators can edit or cancel their events through the personal
  events UI, with creator-only database authorization.
- Personal event creators can search for an individual runner and generate a
  recipient-bound invitation link that expires after seven days and can only be
  accepted by that runner.
- Personal event creators can search for a flock and create one universal,
  seven-day invitation whose eligibility follows live flock membership. Later
  joins become eligible, departures lose unaccepted access, and each accepted
  runner keeps durable event access.
- Eligible runners see pending personal-event invitations on the Events screen
  and can accept them in app. Shared links remain an optional fallback rather
  than the required delivery path.
- Runners can opt each supported browser or installed PWA into event alerts
  from Settings. Standards-based Web Push covers personal invitations and
  flock-event creation, material updates, and cancellation. Server-side claims
  recheck live eligibility, deliver across registered devices, remove stale
  endpoints, and deep-link to the relevant Events inbox or flock detail.
- Flock-event alerts snapshot current membership when a change occurs, exclude
  the actor, skip members who leave before delivery, and do not replay old
  changes to later joiners. Superadmin cancellations notify every current flock
  member, including the owner.
- iPhone and iPad notification setup explains the required Home Screen install.
  Hosted delivery still requires the documented VAPID secrets, frontend public
  key, Edge Function deployment, and authenticated database webhook; none are
  applied to a hosted environment by this branch.
- Deterministic local data includes owner-only, two-person, and five-person
  rosters with varied display-name lengths, flock locations, and flock
  descriptions for realistic list and detail development.
- Any flock member can create an opaque invitation that expires after 24 hours.
  Private storage keeps only its token hash, and the generated link supports
  native device sharing when available, copy fallback, and manual-copy
  recovery.
- Invitation acceptance atomically consumes the token and creates membership.
  No runner—including the original recipient—can use it again afterward.
- The protected live router exposes `/flocks`, `/profile`, `/flocks/new`,
  `/flocks/:flockId`, `/flocks/:flockId/invitations/new`, and
  `/invitations/:invitationToken` as one complete create, invite, and join
  workflow.
- Route controllers keep navigation deterministic for direct links and restored
  auth flows, without depending on browser history.
- Authenticated runners can search discoverable runner display names and flock
  names from the protected `/discover` route through limited, authenticated
  database functions.
- A seeded `organizer@flock.com` account has the server-enforced
  `superadmin` role, which can read and manage all current flock and event
  records through expanded RLS policies and protected RPCs.
- Superadmins can open the protected `/admin` dashboard to review all seeded
  flocks and runners and delete a flock through a confirmation dialog.
- The superadmin dashboard also provides a server-paginated view of every flock
  and personal event, including creator, type, schedule, location, and status.
  A superadmin can cancel an upcoming event through the existing protected
  cancellation transaction without deleting its record or attendance history.
- Superadmins can review all flock memberships in a separate server-paginated
  view and remove an ordinary member through a protected database function.
  Owner memberships remain visibly protected because ownership transfer is not
  supported; removing a member does not delete the runner, flock, or personal
  events.

## Current application boundary

The live router exposes sign-in, the OAuth callback, and the protected flock
workflow through explicit route-controller modules. The protected index and
`/flocks` both render the flock collection; list actions reach `/profile` and `/flocks/new`
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
privacy gate; discovery currently exposes only limited names and opaque IDs.

## Next planned increments

1. Run the moderated sessions in `docs/WORKFLOW_VALIDATION.md` with at least
   three organizers and three runners, record anonymized evidence, and resolve
   any critical findings before selecting the next product milestone.

## Known follow-ups

- Add notification categories, delivery retry scheduling, and an operational
  delivery dashboard only after real notification volume justifies them.
- Expand the current visual foundation into a broader component design system
  only after enough real screens exist to reveal repeated product needs.
- Extract a reusable authenticated-PWA starter only after the first complete
  Flock workflow proves the authentication and application conventions.

## Restart checklist

For a new Codex task:

1. Read `AGENTS.md` and this file.
2. Read the source documents relevant to the next branch.
3. Inspect `git status`, the active branch, recent commits, and existing tests.
4. Confirm the next branch completes one cohesive, independently reviewable
   outcome without unrelated work.
5. Create a focused branch and preserve the no-commit/no-push rule.
