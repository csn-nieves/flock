# Flock system design

Last reviewed: 2026-10-08

## What Flock is

Flock is a mobile-first application for organizing run clubs. A run club is a
“flock.” The first complete product slice will let an organizer create a flock,
share an invitation, let another runner join, and show the flock's member list.
One current-member chat now exists for each flock and participant-only direct
messages are reached from the application shell's conversation groups.
Monetization, live run tracking, and fitness integrations remain outside the
current implemented boundary.

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
                    │       ├── ChatsRoute → ChatsPage
                    │       ├── ProfileRoute → ProfilePage
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

`vite-plugin-pwa` compiles the custom service worker and injects its Workbox
precache manifest. The application shell and essential static assets are
cached, SPA navigation retains its application-shell fallback, and the worker
handles event and chat pushes plus notification-click deep links. Data mutations
are not presented as offline-capable: membership and authentication still
require a network connection. A new service worker asks before refreshing an
open screen so an update cannot silently discard in-progress work.

### Push notifications

Notification permission is an explicit per-device setting. The browser creates
a standards-based `PushSubscription`; an authenticated security-definer
function stores its endpoint and encryption keys in the private schema. A user
may therefore register a phone, tablet, and desktop independently without
exposing any subscription through the browser-facing tables.

Targeted invitation creation queues one recipient. Universal flock invitation
creation queues every current eligible member, while a membership-insert
trigger queues later joiners during the seven-day window. The private job has a
unique invitation-and-user identity so duplicate database events cannot send
the same invitation twice. Delivery claims recheck live membership and all
other inbox eligibility before returning any event content.

Creating, materially updating, or canceling a future flock event records an
immutable activity and queues every current member except the actor. Later
joiners do not receive historical activity, and a delivery claim skips anyone
who has since left. A superadmin cancellation queues all current members,
including the flock owner. Older create or update activity is suppressed when
a newer change already exists for the event.

A database webhook invokes the `send-push-notification` Edge Function for
pending jobs. The webhook supplies a current Supabase project secret through
the `apikey` header, and the function verifies it against the platform-provided
`SUPABASE_SECRET_KEYS` dictionary before claiming work. The service-role
credential stays inside the function for privileged RPCs. The function sends
the encrypted payload to every current device subscription through the
browser's own push service, records one idempotent outcome, and removes
endpoints that return `404` or `410`. Invitation alerts open
`/events#event-invitations`; flock-event alerts open
`/flocks/:flockId#flock-events`. The existing Events and flock detail screens
remain the durable sources of truth when delivery is delayed, unsupported,
blocked, or suppressed by the operating system.

Flock and direct-message sends queue one private job only for each eligible
recipient who already has an active device subscription. Flock jobs snapshot
current membership while direct jobs target the other participant; neither
queues the sender. Delivery rechecks current conversation access and the
recipient's monotonic read cursor, skips messages already read, and suppresses
an older undelivered job when a newer unread message exists. Chat notification
text identifies the conversation and sender without including the private
message body. One replacement tag per conversation keeps the operating-system
surface focused on the latest activity, and notification clicks deep-link to
the authorized `/chats/:flockId` or `/chats/direct/:conversationId` route.

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

`PageBackButton` is the shared app-owned return control for nested product
pages. It composes the canonical secondary `Button`, keeps a labeled 44-pixel
touch target visible across loading and failure states, and emits intent rather
than reading the router. The route controller chooses the known parent
destination and replaces the current nested entry, so direct links have the
same safe result as in-app navigation without replaying uncertain browser
history.

`FlockList` receives typed flock summaries and emits the selected flock
identifier. It owns accessible list and selection semantics but not fetching,
navigation, or empty-state copy. Long names remain fully readable on narrow
screens, and the route controller decides what selecting a flock means.

`FlockDetailsForm` owns flock-name, coarse-location, and short-description
input, normalization, and the database-aligned required and length validation
experience. A named create/edit mode keeps action and progress vocabulary
consistent while the same component preserves entered values after safe
mutation errors. It does not call React Query or Supabase, keeping mutation
orchestration at the route layer.

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
`CreateFlockPage`. The page composes the shared `FlockDetailsForm`, so validation,
input preservation, and duplicate-submit protection keep their established
owners. The live route at `/flocks/new` navigates to the returned flock's detail
URL only after creation succeeds. It replaces the completed form in browser
history so Back returns to the owning list.

`FlockDetailRoute` reads the flock identifier, calls `useFlock` and
`useFlockMembers` in parallel, and maps those query results around the pure
`FlockDetailPage`. A missing row and a row hidden by Row Level Security both
arrive as `null` and deliberately share the same not-found presentation. The
member section has its own loading, empty, failure, retry, populated,
background-refresh, and stale-refresh-failure states, so a roster problem does
not replace an otherwise usable flock page. The protected router exposes the
route at `/flocks/:flockId` as the destination for list selection and
successful creation. The page shows the flock's location and description to
every authorized member. The controller exposes profile editing only to the
canonical owner, maps `useUpdateFlock` into the shared edit form, updates the
detail cache after server confirmation, and refreshes flock lists so changed
identity data stays consistent across routes.

`ChatsRoute` owns `/chats`, `/chats/:flockId`, `/chats/direct/new`, and
`/chats/direct/:conversationId`. `AppShell` loads the
authenticated runner's current flock-chat destinations through `useFlockChats`
and participant-only conversations through `useDirectConversations`, then
presents them as separate Flock chats and Direct messages groups in the
persistent desktop sidebar or mobile navigation drawer. There is no generic
Chats navigation item. The route resolves its selection against the relevant
authorized cached list and enables a message query only for a selected current
membership or conversation participant. The pure `ChatsPage` owns the selected
thread and the phone return directory; the desktop thread uses the available
application canvas rather than repeating a second conversation list.
Both list queries return latest-message context, server-derived unread counts,
and activity ordering. `useConversationDirectorySync` mounts once in the shell
and invalidates those list caches for authorized message inserts or changes to
the signed-in runner's read cursors, avoiding duplicate subscriptions when the
route also consumes the same cached lists.
Superadmin visibility into flock administration does not imply private-chat
access. The message hook owns cursor history, send mutation state, cache
deduplication, and the filtered Realtime subscription; the page receives only
application-shaped messages and callbacks.

`ProfileRoute` calls `useProfile` and `useUpdateProfile`, owns the protected
`/profile` destination, and maps loading, retry, save, and success state into
the pure `ProfilePage`. The update function derives the target from
`auth.uid()` and the mutation invalidates member-list queries so edited names
and locations are reflected in flock detail views.

Pages stay in one file while their presentation remains easy to scan. When a
page grows, it moves into a domain-named directory with page-scoped feature
components. Route orchestration stays separately visible in `src/routes`.
Page-only pieces remain beside their page rather than entering `src/components`;
only behavior reused across pages is promoted.

The flock collection is the parent for flock creation, flock detail, and
invitation acceptance. A flock detail page is the parent for invitation
creation. Those nested pages render the shared back control in every route
state, including loading, not-found, and recoverable failure. The collection
itself is top-level. Sign-in and OAuth callback routes keep their task-specific
recovery actions because treating an external authentication handoff as a
normal product parent would be misleading.

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

`src/data/flocks.ts` owns the first product-data read. It selects the flock's
identifier, owner, name, location, and description and does not accept or
filter by a user identifier. The active
Supabase session supplies database identity, and PostgreSQL Row Level Security
determines which rows are visible. Query failures reject from the data layer so
React Query hooks can own cache and recovery behavior without exposing
Supabase calls to pages or components.

The same module can read one flock by identifier with `maybeSingle`. It returns
`null` when Row Level Security exposes no matching row, preserving the database
authorization boundary without teaching the client whether the row is absent
or merely inaccessible. `useFlock` caches that result under the established
detail query key.

The same module owns flock creation and update. Creation submits normalized
name, location, and description values; PostgreSQL enforces their constraints,
generates the identifier, and derives `owner_id` from the active authenticated
session. Updates identify the flock but never accept an owner identifier. Row
Level Security permits the canonical owner or existing superadmin policy to
perform the write, keeping ownership and authorization inside PostgreSQL. Both
mutations return the same flock-summary shape used by list and detail
consumers.

The shared Supabase client is parameterized by the generated `Database` type in
`src/types/database.ts`. That file describes only the exposed `public` schema
and is regenerated from the migration-built local database with
`npm run db:types`; it is committed for deterministic builds but never edited
by hand. Generated types provide compile-time table contracts, while Row Level
Security, constraints, and input validation remain the runtime authority.

## Messaging

`flock_messages` stores text messages with flock, sender, and deterministic
creation ordering. Formatted bodies use an app-owned, versioned list of text
runs with bounded bold, italic, and underline flags. The client validates that
structure and renders it through React elements; it never interprets message
bodies as HTML. This keeps overlapping formatting deterministic while the rich
composer remains visual without changing the database contract. A compatibility
renderer preserves messages written with the branch's earlier bounded marker
format. Pasted content enters as plain text, and emoji remain ordinary Unicode
text. Current membership governs reads through Row Level Security.
The browser has select access only; `send_flock_message` derives the sender from
the authenticated session, checks live membership, trims the body, and returns
the inserted message with its display name. A superadmin who is not a member
cannot read or send private chat messages.

`list_my_flock_chats` derives the caller from `auth.uid()` and returns only
flocks where that runner has a current membership. The Chats panel does not use
the broader flock collection query because superadmin administration may expose
flocks that must remain absent from private messaging. Creating a flock or
accepting a flock invitation invalidates this dedicated list so the persistent
sidebar reflects the new membership without a page reload. The function also
returns the latest message and an unread count of messages from other members
after the runner's exact read cursor. Before a cursor exists, membership time is
the boundary so joining a flock does not make earlier history unread.

`flock_chat_reads` stores one cursor per membership and cascades when that
membership ends. `mark_flock_chat_read` verifies both current membership and
message ownership by the target flock, then advances `(created_at, id)` only
when the supplied message is newer. Clients can select only their own row and
cannot write the table directly.

`list_flock_messages` returns reverse-chronological keyset pages using the
composite `(flock_id, created_at desc, id desc)` index. The data layer reverses
each bounded page for chronological rendering, and React Query retains pages so
the presentation can prepend older history without visible pagination. The
message log snapshots its scroll height before a prepend and restores the
reader's visual position afterward.

Supabase Realtime publishes message inserts. A member subscribes to only the
current flock, hydrates each insert with its authorized sender profile, and
deduplicates it against the send mutation result. Each insert also refreshes the
persisted message page immediately, so delayed profile hydration cannot hide a
message. Live arrivals append while a runner is near the bottom; otherwise the
interface offers a New messages action. Realtime is not the source of truth: a
successful subscription refreshes persisted history once to
close the gap between the initial query and the live channel. Refresh or
reconnect can therefore recover missed messages.

`direct_conversations` stores one unique, canonical participant pair by ordering
its two profile identifiers. `get_or_create_direct_conversation` derives the
caller from `auth.uid()`, rejects self-conversations, and uses the unique pair
constraint to return the same thread under concurrent creation. Conversation
and message Row Level Security permits exactly those two participants; a
superadmin receives no implicit access. The direct conversation list returns
only the other participant's identifier and display name, and direct
participation extends profile visibility only across that pair.

`direct_conversation_reads` stores the same monotonic cursor independently for
each participant. With no cursor, the conversation creation time is the unread
boundary. `list_my_direct_conversations` excludes the caller's own messages
from unread counts, returns the latest sender and body, and orders active
conversations before empty ones. The protected mark-read function verifies the
participant and target message before advancing the cursor.

`direct_messages` follows the same append-only text contract, cursor index,
protected send path, safe rich-text renderer, generic React Query message hook,
and filtered Realtime recovery model as flock messages. The shared message hook
marks the newest loaded message read while a thread is open; cursor-table
Realtime changes then synchronize the cleared state to another signed-in
device. Runner search is
route-local transient state: a 300ms debounce limits queries, composition pauses
search, self-results are removed, and stale requests cannot select or replace a
different query-key result. This increment does not include attachments, edits,
deletion, reactions, blocking, reporting, typing indicators, per-message read
receipts, notification categories, or per-conversation muting.

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

Postgres migrations are the source of truth for product data. The membership
model contains public `flocks`, `flock_members`, and `profiles` tables plus
private `flock_invitations`. A flock has one canonical `owner_id`, and the same user
receives an `owner` membership from an after-insert trigger in the same
transaction. A partial unique index prevents a second owner membership. Every
other membership has the `member` role. Flocks also store an optional legacy-
compatible coarse location and short description. New product flows require
both values, while nullable storage avoids inventing data for records that
predate the profile-details migration.

`profiles` is the deliberately narrow public identity surface for a member
list. It contains a user identifier, display name, and optional coarse
location, never an email address or
other authentication record. A trigger copies the best available display name
from authentication metadata for new users and later metadata changes, with a
neutral `Runner` fallback. Its Row Level Security policy exposes a profile only
to that runner and authenticated runners who share at least one flock.

Profile, flock, and event images live in the private `flock-media` Storage
bucket rather than public URLs. Deterministic resource paths place profile
photos under the owning user, flock covers under the flock owner, and event
covers under the event creator. Storage policies mirror the table authorization
boundary: profile photos are visible to the owner and shared flockmates, while
flock and event covers are visible only to authorized members or the creator.
The client validates JPG, PNG, and WebP files up to 5 MB, uploads through the
authenticated Supabase client, and resolves short-lived signed URLs for
rendering. Missing media keeps the existing initial or text fallback.

The explicit owner column makes ownership checks and account-deletion behavior
simple: the owner alone can update or delete a flock, and deleting the owner's
authentication record removes the flock and its memberships. Ownership transfer
is intentionally unsupported until it can be implemented as one database
transaction that changes both the flock and owner membership together.

Both public tables have Row Level Security enabled and explicit grants. Signed-
out users receive no table privileges. Signed-in users can create flocks. The
canonical owner can read the new flock immediately, while other users can read
only flocks and rosters where they hold membership. They cannot write the
membership or invitation tables directly.

The browser loads a roster through `list_flock_members`, a stable
security-invoker database function that joins visible memberships to visible
profiles in one request. Table Row Level Security remains authoritative for
both sides of the join. The function returns only user identifier, display
name, role, and join time, ordered with the owner first and other runners by
display name. `src/data/flockMembers.ts` validates the role at the network
boundary and translates the result into application-shaped member summaries.

Invitation creation uses a `security definer` database function rather than a
table grant. The function verifies that the authenticated caller currently
belongs to the target flock, creates 32 random bytes of token entropy, stores
only its SHA-256 hash in the private schema, and returns the raw token once. An
invitation expires 24 hours after creation and records one atomic consumption.
Members may create multiple invitations, but each individual token can add only
one runner.

Invitation acceptance and membership creation happen inside one reviewed
`security definer` function. A conditional update claims the matching unused,
unexpired token before inserting membership, so concurrent callers cannot both
win. Every later call, including one from the consuming runner, receives the
same unavailable result as an invalid or expired token. The function returns
the joined flock on its sole successful use so the route can seed its detail
cache and replace the token-bearing URL.

The live protected router exposes creation from flock detail and acceptance at
`/invitations/:invitationToken`. Signed-out runners preserve the complete
invitation path through authentication. A signed-in runner accepts immediately,
matching the first-slice product contract, then lands on the joined flock. The
token is never placed in document titles, feedback text, logs, or persistent
client storage beyond the existing short-lived authentication destination.

After creation, the route controller feature-detects the browser's native Web
Share API and passes a share callback into the pure page only when it is
available. Closing the operating-system share sheet is treated as cancellation,
not failure. Copy remains available as the portable fallback, and a clipboard
failure leaves the invitation URL selected for manual copying.

Membership-backed read policies use a `security definer` helper in the private,
non-exposed schema. This avoids recursive policies on `flock_members`. The
function has an empty search path, fully qualified table references, restricted
execution privileges, and an index supporting its user-and-flock lookup.

Database behavior is tested below the frontend with transactional pgTAP tests.
The suite verifies schema protections, grants, owner creation, member and non-
member visibility, profile privacy and synchronization, roster ordering,
owner-only writes, the single-owner constraint, cascading membership cleanup,
invitation authorization, token hashing, unique links, and the 24-hour
lifetime. Acceptance coverage verifies membership creation, strict
single-use replay protection for every caller, expiry, and safe handling of
malformed tokens.

## Event run options and attendance

Every newly created flock or personal event has between one and eight ordered
run options.
Each option stores a distance in tenths, an optional target pace in seconds,
and one shared miles-or-kilometers unit. A null target pace explicitly means
“Run at your own pace”; it is not an unknown value. The database retains
separate distance and pace unit columns for compatibility but constrains them
to equality. Distance is offered from 0.1 through 100 in tenth-unit steps.
Target pace is offered in five-second steps from 4:00 through 15:00 per mile or
2:30 through 9:30 per kilometer. Concise display labels, including the own-pace
label, are derived server-side for existing read paths and notifications rather
than accepted from the browser. Stable option identifiers let an organizer edit
values without disconnecting existing responses. An edit may also remove an
option; the foreign key preserves each attendance row and sets its removed
selection to null so the organizer can see that an earlier response needs a new
choice.

The form uses an authored dark multi-column wheel with a centered selection
band and faded neighboring values. A maintained wheel primitive provides touch
dragging, inertial scrolling, snapping, and keyboard movement; Flock adds
spinbutton names and current-value announcements. One segmented measurement
control changes both distance and any target-pace unit, converting the selected
effort to the nearest supported five-second value. A separate segmented control
switches between a target pace and running at the runner's own pace; the numeric
wheel is hidden when no target pace applies.
Earlier free-text options keep their labels and remain readable; editing one
shows the earlier value and requires the organizer to confirm structured values.

The personal and flock create functions and the shared event update function
validate and write the event and its complete option set in one transaction.
Browser clients receive only select access to options. Row Level Security
exposes them to the same event creator,
flock members, accepted personal-event invitees, and superadmins who may read
the parent event; direct option writes remain unavailable.

“I’m in” and “Maybe” require an option when the event has any. “I’m out” always
stores a null option. The response function verifies both event access and that
the selected option belongs to that event before upserting attendance. Events
created before the option migrations have no options and continue to accept the
original response contract, avoiding fabricated organizer choices.

The flock and personal event queries load visible events, attendance, and
ordered options, then map aggregate counts plus per-option in/maybe groups into
application types. Route controllers own mutations and query invalidation. The
pure flock-events section and personal-events page show grouped counts and open
an accessible radio-choice dialog
before saving an in or maybe response. Create and edit forms preserve their
drafts after recoverable failures, and option changes count as material event
updates for the existing flock-alert pipeline.

Each structured run option may also carry one mapped route. The browser accepts
a GPX track or route up to 2 MB, selects the longest segment, calculates its
distance, simplifies the line to at most 1,000 longitude/latitude pairs, and
discards the source file, filename, timestamps, elevation, author, and device
metadata. PostgreSQL independently requires two to 1,000 geographically valid
coordinate pairs and a bounded calculated distance. Route replacement and
removal are part of the same atomic event-option update as distance and pace.

Route columns live on `flock_event_run_options`, so the existing event-aligned
Row Level Security also protects precise route geometry. Only a readable
event's creator, current flock audience, accepted personal-event invitees, or a
superadmin can select it. The shared event-option component identifies mapped
routes on both personal and flock event cards and opens the same accessible map
dialog. MapLibre GL is loaded only when a route preview or map is requested;
OpenFreeMap supplies the public basemap without a browser API key. The map
assets are excluded from PWA precaching so users who never open a map do not
download the large rendering bundle during installation.

The same run-option field also opens an authored route planner. Its lazy-loaded
MapLibre surface lets a creator place up to 25 ordered waypoints by pointer or
by panning the keyboard-operable map and adding its center. The
`useRoutePlanner` hook owns cancellation and calls the provider adapter in
`src/data/routePlanning.ts`; visual components never call the provider
directly. Geoapify walking routing connects only the previous and new points,
so Undo and Clear require no extra request and a failed segment leaves the
accepted draft intact. Event-location geocoding is best effort and only centers
the initial view. Those requests necessarily disclose the entered event
location and selected waypoint coordinates to Geoapify while the creator is
drawing; they are not sent merely to view a saved route.

The browser merges successful segments, limits the completed line to the same
1,000-coordinate contract as GPX, and sends the existing `EventRoute` shape
through the unchanged atomic event mutation. Waypoints, geocoding results,
provider identifiers, and directions are not stored. A saved route is therefore
provider-neutral and viewable without Geoapify, but editing it requires drawing
a replacement or importing another GPX file.

## Reusable saved routes

Authenticated runners can copy any drawn, imported, or previously reused event
route into a private saved-route library. Each entry stores an owner-scoped
name, the same bounded provider-neutral coordinate line used by event options,
and its calculated distance. The library deliberately does not retain pace,
event metadata, draft waypoints, directions, provider identifiers, or the GPX
source. A case-insensitive unique name keeps the picker scannable, and each
runner may retain up to 100 routes.

`saved_routes` exposes owner-only reads through Row Level Security. Creation,
rename, and deletion use authenticated security-definer functions that derive
the owner from `auth.uid()`; the browser never supplies an owner identifier and
has no direct write grant. Applying a saved route copies its current geometry
and distance into the event draft. Event creation remains atomic and
independent, so later library renames or deletions cannot change an existing
event or an unsaved draft.

The personal-events and flock-detail route controllers own one shared React
Query-backed library state and mutation set. Pure pages and event components
receive that state through props. The picker presents loading, failure, empty,
ready, rename, delete-confirmation, and mutation-error states, with only the
selected route loading a large map preview.

## Repeating event plans

Personal-event creators and flock organizers can start a new event from an
existing event card. This remains a create operation rather than a special
database copy operation: the pure page maps the existing title, location,
description, structured run options, and copied route geometry into the shared
create form, while leaving the date empty so the organizer must choose the new
schedule deliberately.

The mapping drops event and run-option identifiers as well as every lifecycle
field. Invitations, RSVP responses, attendance groups, creation metadata, and
cancellation state therefore cannot enter the create mutation. Submission uses
the existing personal- or flock-event create path, preserving its transaction,
authorization, query invalidation, and notification behavior. A failed request
keeps the repeated draft open for retry; notifications begin only after the new
event is actually created.

## Superadmin event operations

The protected `/admin` route is available only when the authenticated session
contains the server-issued `superadmin` role. It loads global event records in
pages of 20, ordered by scheduled date with the latest first, and combines them
with the existing global runner list to present creator names without exposing
authentication records. URL query state owns the current page so navigation is
repeatable and invalid or out-of-range pages are replaced with a safe value.

The page distinguishes flock and personal events and shows upcoming, past, and
canceled states. Only upcoming events offer a cancellation action. The route
uses the existing `cancel_flock_event` database function, whose server-side
authorization permits the event owner or a superadmin. Cancellation is
pessimistic and retains the event and attendance records rather than deleting
history. Row Level Security remains the authority for the global read, and
database coverage verifies that a superadmin can cancel another runner's
personal event while preserving its row.

## Superadmin membership operations

The admin dashboard loads global flock memberships in independent pages of 20,
ordered by join date with the latest first. Membership page state uses its own
`membersPage` URL parameter so event and membership navigation remain
independent and restorable. Each record shows the runner, flock, role, and join
date; the responsive representation preserves the same information and action
on phone and desktop.

Only ordinary `member` records can be removed. Owner memberships are the
database mirror of each flock's canonical `owner_id`, so the interface marks
them as protected and the database function rejects their removal. The
`remove_flock_member` security-definer function requires the server-issued
`superadmin` role, remains safe to repeat after a completed removal, and does
not grant clients direct membership-table writes. Removal revokes access that
depends on current flock membership while preserving the runner account, flock,
and independently owned or previously accepted personal events.

## Personal event invitation audiences

Runner-owned personal events can invite either one discovered runner or the
live membership of a discovered flock. Personal-event invitations expire after
seven days. A targeted runner invitation remains recipient-bound and
single-use. A flock audience creates one private invitation row with one token
hash and one flock identifier rather than expanding or storing its roster.

The flock invitation's eligibility is evaluated against current membership.
Members who join before expiration can see and accept it, while members who
leave before accepting can no longer do either. Each accepted member receives a
private acceptance record, so the universal link can serve multiple eligible
runners while remaining single-use per runner. That acceptance grants durable
event and attendance access even if the runner later leaves the flock.

`list_pending_event_invitations` returns only active, upcoming invitations for
the authenticated runner. It supports both recipient-bound and live-flock
audiences without exposing private token hashes. Runners accept those records
through `accept_event_invitation_by_id`, while the token route remains an
optional sharing fallback. `EventsRoute` owns the inbox query, acceptance and
creation mutations, URL creation, and raw failure translation. The pure page
shows responsive loading, error, retry, pending, and acceptance states.

Database tests enforce event ownership, execution grants, seven-day expiry,
live join and leave behavior, per-runner replay protection, multiple members
using one universal link, and durable access after acceptance.

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

Email-code requests also provide the same-origin `/auth/callback` URL to
Supabase. The configured six-digit template remains the product flow, but this
callback lets a project-team member complete a hosted smoke test when
Supabase's restricted default mailer sends its confirmation link instead. The
callback exchanges the returned PKCE code in the browser that requested the
email and then resumes the existing saved-destination flow.

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

### Playwright full-stack tests

Two desktop Chromium golden paths run against a freshly reset local Supabase
stack without REST mocks. A server-side test helper uses the local secret key
only to generate ordinary signed sessions for two seeded users; the key never
enters Vite or the browser. The organizer and runner then use the application
through their normal authenticated Supabase clients. One journey covers flock
creation, single-use invitation acceptance, roster refresh, flock-event
visibility, distance-and-pace selection, and RSVP persistence. The other covers
universal personal-event flock invitations, live eligibility, acceptance, and
attendance refresh.

The full-stack suite deliberately stays narrow. The faster page matrix owns
responsive browser coverage and failure states, pgTAP owns exhaustive database
authorization contracts, and moderated sessions own usability evidence.

### Continuous integration

GitHub Actions reports static analysis, unit tests, component tests, page tests,
the local full-stack suite, and the production build as distinct checks. The
separation makes failures easier to identify and allows independent jobs to run
in parallel. Each responsive browser suite runs its desktop Chromium,
Android-sized Chromium, and iPhone WebKit projects in one job. This preserves
project-labeled platform coverage while installing the headless Chromium shell
and WebKit only once per suite instead of repeating checkout, dependency
installation, and browser setup per device.

## Current constraints and revisit points

### Route loading and bundle size

The application shell, authentication routes, and default flock collection
remain eager because they own startup, sign-in, and the most common landing
path. Secondary route controllers use React Router's static `lazy` route
property, so the router can match every URL immediately while Vite loads the
selected implementation on demand. Direct links and restored authentication
destinations therefore keep the same route contract without placing every
page, hook, and mutation in the entry chunk.

The PWA still precaches generated route chunks for reliable later use, but an
unvisited route is not parsed or executed during initial rendering. Revisit
route preloading only when real navigation timing shows that a specific
secondary destination benefits from it.

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

The flock and membership tables have Row Level Security policies and
authorization tests. Private invitation storage has no client grants; its
creation function has explicit execution privileges and caller authorization.
Every new operation must extend the database boundary deliberately; hiding a
control in the UI will never be treated as authorization.

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
