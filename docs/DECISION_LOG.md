# Flock decision log

Last reviewed: 2026-10-07

This log records decisions that shape future work. Each entry includes the
reasoning and the conditions that would justify another decision. “Accepted”
means it is the current direction, not that it can never change.

## D001 — Build a mobile-first progressive web app

- **Status:** Accepted
- **Decision:** Ship Flock as an installable PWA before considering native iOS
  or Android applications.
- **Why:** Runners will primarily use Flock on phones, but a native release adds
  two platform toolchains, store review, signing, and developer-program costs.
  A PWA reaches phones and desktop from one codebase and lets the project test
  the core product sooner.
- **Tradeoffs:** Installation and notification behavior vary by browser. Deep
  native integrations may be weaker. The UI still needs genuine mobile and
  WebKit testing rather than assuming responsive CSS is enough.
- **Revisit when:** Product evidence requires native-only capabilities or PWA
  limitations materially block retention or a core workflow.

## D002 — Use React, TypeScript, and Vite

- **Status:** Accepted
- **Decision:** Use React for UI composition, strict TypeScript for contracts,
  and Vite for development and production builds.
- **Why:** This combination supports a stateful client application without the
  server-rendering and hosting complexity of a larger full-stack framework.
  Vite also integrates directly with Tailwind and the PWA plugin.
- **Alternatives considered:** A native application was deferred by D001. A
  server-rendered React framework was unnecessary for the initial private
  membership workflow.
- **Tradeoffs:** The client owns more routing and loading behavior. Public pages
  may require a new rendering decision if search discovery becomes important.
- **Revisit when:** Flock adds public, search-indexed content or server rendering
  solves a measured performance or product problem.

## D003 — Use React Router for addressable workflows

- **Status:** Accepted
- **Decision:** Give application destinations real client-side routes, starting
  with `/sign-in` and eventually including invitation and OAuth callback URLs.
- **Why:** Invitation links must be shareable, browser Back must be meaningful,
  and OAuth needs a stable callback destination.
- **Tradeoffs:** Each route must own loading, error, title, session, and redirect
  behavior. A route cannot be treated as a visual component alone.
- **Revisit when:** Only if the application framework or rendering architecture
  changes.

## D004 — Separate pages, components, and primitives

- **Status:** Superseded by D021
- **Decision:** Use the default dependency direction
  `pages → components → primitives`.
- **Why:** Primitives remain reusable and easy to verify when they do not know
  about Flock or Supabase. Components remain presentational when data and event
  callbacks arrive through props. Pages can then own complete workflows and
  start remote work from the highest practical layer.
- **Tradeoffs:** Pages and controller hooks may contain more orchestration. Some
  prop passing is intentional because it keeps hidden data dependencies out of
  the visual layers.
- **Revisit when:** A repeated cross-page behavior has a clear shared owner. Add
  a domain hook or provider rather than allowing lower layers to query data
  directly.

## D005 — Use Tailwind with semantic CSS tokens

- **Status:** Accepted
- **Decision:** Use Tailwind for component styling while keeping semantic CSS
  custom properties as the runtime source of truth.
- **Why:** Tailwind makes layout and state styling fast without requiring a
  component library. Semantic tokens keep the brand system independent from
  utility syntax and prevent raw colors from spreading through feature code.
- **Tradeoffs:** Class lists can become long and still require design discipline.
  `DESIGN.md`, runtime tokens, Tailwind aliases, and primitives must stay in
  agreement.
- **Revisit when:** Styling repetition shows a missing shared primitive or when
  a different styling system solves a measured maintainability problem.

## D006 — Use Supabase as the initial backend

- **Status:** Accepted
- **Decision:** Use Supabase for PostgreSQL, authentication, realtime, storage,
  and narrowly scoped server functions when secrets are required.
- **Why:** It provides the backend capabilities Flock expects without operating
  several services before the product has users. Its browser client supports a
  low-cost PWA architecture.
- **Tradeoffs:** Direct browser access makes Row Level Security essential. The
  Supabase client also contributes materially to the initial JavaScript bundle.
- **Revisit when:** Scale, cost, portability, security requirements, or missing
  capabilities outweigh the reduced operational burden.

## D007 — Use email OTP plus Google and Facebook authentication

- **Status:** Accepted; email and social browser flows implemented, provider
  configuration pending
- **Decision:** Offer a six-digit email code plus Google and Facebook through
  Supabase OAuth with PKCE.
- **Why:** A code avoids password creation and recovery. It also keeps an
  installed-PWA user inside Flock instead of requiring a magic-link handoff.
  Social providers reduce friction for users who prefer them. Flock is a
  browser-based public OAuth client and cannot keep a fixed client secret
  confidential. PKCE binds each returned authorization code to a fresh verifier
  retained by the browser that initiated the flow, so an intercepted code
  cannot be exchanged on its own.
- **Tradeoffs:** Email delivery and rate limits become part of the experience.
  OAuth adds provider configuration, callback validation, and destination
  restoration. A PKCE exchange must finish in the same browser and device that
  created its verifier. Overlapping flows may require Supabase flow IDs if they
  become a real usage pattern.
- **Revisit when:** Delivery reliability, user research, or account-linking
  requirements call for another method such as passkeys.

## D008 — Keep authentication transport out of forms

- **Status:** Accepted
- **Decision:** Forms validate local input and emit intent. A workflow hook
  coordinates Supabase calls, phases, cooldowns, loading, and safe errors.
- **Why:** The forms can be tested and reused without a backend. Transport
  details remain in data modules, and the page still owns the complete route
  workflow.
- **Tradeoffs:** The hook has a larger state surface, so it needs focused tests
  and clear property names.
- **Revisit when:** Authentication behavior moves to a server boundary or the
  state machine becomes complex enough to justify an explicit reducer.

## D009 — Use an absolute resend deadline

- **Status:** Accepted
- **Decision:** Calculate OTP resend availability from an absolute timestamp,
  not only by decrementing a counter.
- **Why:** Browsers throttle timers when a phone is backgrounded. Recomputing
  from `Date.now()` corrects the displayed time when execution resumes.
- **Tradeoffs:** The hook owns both a deadline reference and rendered remaining
  seconds. Tests require controlled time.
- **Revisit when:** Supabase exposes an authoritative retry timestamp that can
  replace the client-derived deadline.

## D010 — Test logic, components, and pages separately

- **Status:** Accepted
- **Decision:** Use Vitest and React Testing Library for fast behavior tests,
  Playwright component projects for isolated browser behavior, and Playwright
  page projects for routed workflows.
- **Why:** These layers answer different questions. A form can work alone while
  its route wiring fails, and DOM simulation cannot prove browser layout or
  mobile WebKit behavior.
- **Tradeoffs:** More suites require more configuration and CI time. The browser
  gallery remains necessary as the component mount harness even though it is
  not a product surface.
- **Revisit when:** Suite duration or duplication becomes measurable. Consolidate
  only when failure ownership remains clear.

## D011 — Report CI responsibilities as separate checks

- **Status:** Accepted
- **Decision:** Run static analysis, units, component browsers, page browsers,
  and production build as distinct GitHub Actions jobs. Run the three component
  browser projects together and the three page browser projects together, so
  each browser-suite job installs its required engines only once.
- **Why:** A failing check identifies its layer immediately, and independent jobs
  can run in parallel. Playwright's project labels keep desktop Chromium,
  Android-sized Chromium, and iPhone WebKit failures identifiable inside the
  owning suite without paying for six separate runner setups.
- **Tradeoffs:** Device-specific failures no longer appear as separate GitHub
  status checks, and all projects in one suite share its timeout. This is
  accepted because browser installation dominated the small test suites, while
  component-versus-page failure ownership remains clear.
- **Revisit when:** A browser suite's execution time, failure isolation, or
  runner resources justify sharding after setup cost is measured separately.

## D012 — Validate public configuration and isolate tests

- **Status:** Accepted
- **Decision:** Fail early when required Supabase browser configuration is
  missing. Keep real values in ignored local/deployment files and commit only
  explicit fake values in `.env.test`.
- **Why:** A silently misconfigured client produces confusing failures later.
  Tests must run in CI without a developer's `.env.local`, and they must never
  send authentication requests to a real project.
- **Tradeoffs:** Any test that imports the client must run in Vite's `test` mode
  or provide an intentional mock.
- **Revisit when:** Configuration moves behind a runtime endpoint or another
  environment-management system.

## D013 — Prefer explicit readability rules

- **Status:** Accepted
- **Decision:** Keep imports at the top of TypeScript files and disallow nested
  ternary expressions through ESLint.
- **Why:** The project favors code that can be understood quickly by a future
  collaborator. Nested conditional rendering and mid-file imports obscure
  control flow even when they are technically concise.
- **Tradeoffs:** Some JSX requires a named variable or explicit `if` branches.
  The additional lines are accepted in exchange for clearer state priority.
- **Revisit when:** Only if the rule creates a documented case that is less
  readable than the expression it prohibits.

## D014 — Use React Query for server data

- **Status:** Accepted
- **Decision:** Use React Query through domain-specific custom hooks for flock,
  membership, and event server state. Establish the provider, cache defaults,
  hierarchical query-key factories, and test provider before the first product
  query. Do not use it for authentication mutations already coordinated by
  Supabase and the auth controller.
- **Why:** Query caching, invalidation, retry, and shared loading state will
  matter when pages begin reading backend records. A small foundation branch
  lets the first data feature follow reviewed conventions instead of defining
  infrastructure and product behavior simultaneously.
- **Defaults:** Reads are fresh for 30 seconds and retry once. This avoids
  immediate duplicate route reads while still recovering from a brief mobile
  connection interruption. Mutations do not retry automatically because a
  repeated write can create duplicate or surprising product actions. React
  Query's focus refetch remains enabled so returning to a backgrounded PWA can
  refresh stale data.
- **Query keys:** Keys begin with a plural domain root and branch into stable
  list or detail scopes. Invalidations should target the narrowest shared key
  that represents the changed server data.
- **Tradeoffs:** React Query adds bundle and conceptual overhead before the
  first product query. The isolated branch makes that cost and policy explicit,
  while unused abstractions beyond the first flock key family remain deferred.
- **Revisit when:** Measured request behavior calls for different defaults or a
  server-data domain cannot be represented clearly by hierarchical keys.

## D015 — Develop in small branches without automated commits

- **Status:** Superseded by D034
- **Decision:** Each reviewable step gets its own branch. The project owner
  normally creates commits and pushes; automated assistance must not commit or
  push without explicit permission.
- **Why:** Small branches keep design and technical decisions visible, make
  regressions easier to locate, and let the owner retain control of repository
  history.
- **Tradeoffs:** More pull requests add process overhead, and dependencies must
  be sequenced carefully.
- **Revisit when:** Team size or release cadence requires a different branching
  model while preserving equivalent review boundaries.

## D016 — Keep custom React hooks in one directory

- **Status:** Accepted
- **Decision:** Keep all custom React hooks in `src/hooks`, including workflow
  controllers, context consumers, and future React Query hooks. Colocate tests
  that primarily exercise a hook.
- **Why:** A single directory gives contributors one predictable answer to
  where hooks belong. It also makes the boundary between React orchestration
  and direct data access easy to see as Flock adds user, flock, membership, and
  event queries.
- **Tradeoffs:** Hooks from different product domains share a directory, so
  names must remain explicit. Domain subdirectories may become useful when the
  number of hooks makes the directory difficult to scan.
- **Revisit when:** Hook volume or naming collisions make a flat directory
  harder to navigate than domain subdirectories under `src/hooks`.

## D017 — Preserve authentication destinations per browser tab

- **Status:** Accepted
- **Decision:** Preserve the first valid internal authentication destination in
  `sessionStorage`, consume it once after authentication, and fall back to `/`.
- **Why:** React state cannot survive an OAuth page redirect, while a URL
  parameter exposes the destination through browser history, copied links,
  logs, and analytics. `localStorage` persists stale navigation intent and
  shares it across tabs. `sessionStorage` survives a same-tab OAuth round trip
  but remains isolated to that tab and disappears when it closes.
- **Security boundary:** Treat the stored value only as a navigation hint.
  Accept a single-slash same-origin path and preserve its query string and hash.
  Reject absolute and protocol-relative URLs, backslashes, surrounding
  whitespace, and authentication routes that could create redirect loops.
  Authorization remains the responsibility of protected routes and Supabase
  policies.
- **Tradeoffs:** Closing the tab discards the destination, and a browser context
  that blocks storage falls back to `/`. The first valid destination wins until
  consumed, so intermediate authentication redirects cannot overwrite the
  runner's original intent.
- **Revisit when:** Authentication intentionally moves across tabs or devices,
  or a server-owned state parameter becomes necessary for a supported flow.

## D018 — Keep social providers restricted during development

- **Status:** Accepted
- **Decision:** Keep Google's OAuth application in testing mode with explicit
  test users and keep Meta's Flock app unpublished while the product is under
  development. Provider credentials remain only in the provider consoles and
  Supabase configuration.
- **Why:** Live end-to-end authentication can be verified without exposing an
  unfinished product to general users or prematurely entering provider review.
  Restricting access also limits the impact of configuration mistakes while the
  surrounding account, authorization, and data-deletion behavior is incomplete.
- **Tradeoffs:** Only approved Google test users and Meta app roles can use
  social sign-in. External testers must be added deliberately until release.
- **Revisit when:** Flock has a deployed production domain, privacy policy,
  user-data deletion process, production branding, and a release candidate that
  is ready for provider verification or publication.

## D019 — Model flock ownership separately from membership access

- **Status:** Accepted
- **Decision:** Store one canonical `owner_id` on each flock, mirror that user
  as the flock's single `owner` membership in the same database transaction,
  and represent everyone else with the `member` role.
- **Why:** A direct owner reference makes owner-only writes inexpensive and
  unambiguous while the membership row keeps roster queries uniform. Cascading
  from the owner's authentication record prevents ownerless flocks. A partial
  unique index and an insert trigger enforce the initial invariant in Postgres
  instead of relying on frontend sequencing.
- **Authorization:** RLS permits authenticated users to create only flocks they
  own. The canonical owner can read the flock directly, while other members
  receive read access through membership. Only the owner can update or delete a
  flock. The application has no direct membership-write grant yet. A detail
  lookup presents the same not-found state for an absent flock and one hidden
  by RLS, avoiding disclosure of another flock's existence.
- **Tradeoffs:** Ownership appears in two related rows. A future transfer must
  update both inside a reviewed database function or transaction; changing
  `owner_id` directly remains forbidden. Deleting the owner currently deletes
  the flock rather than transferring or archiving it.
- **Revisit when:** Flock needs ownership transfer, multiple administrators,
  invitation acceptance, voluntary departure, or an owner account-deletion
  retention policy.

## D020 — Generate frontend database types from the local schema

- **Status:** Accepted
- **Decision:** Generate and commit TypeScript definitions for the exposed
  `public` schema from the migration-built local Supabase database. Apply the
  generated `Database` type to the shared Supabase client and regenerate it
  through `npm run db:types` after a schema change. Do not edit the generated
  file manually.
- **Why:** Migrations remain the database source of truth, while the generated
  contract lets TypeScript infer valid table rows, inserts, updates, and
  relationships. Generating locally verifies the exact migration history under
  review without requiring hosted credentials or depending on whether a remote
  deployment has already happened. Restricting generation to `public` keeps
  private authorization helpers outside the browser-facing type surface.
- **Tradeoffs:** The checked-in file can become stale if a migration changes
  without regeneration. PostgreSQL check constraints also generate broad
  scalar types rather than TypeScript literal unions, so some domain rules must
  still be narrowed at the data boundary or represented as database enums when
  that added coupling is justified.
- **Revisit when:** Schema changes become frequent enough to warrant an
  automated drift check in CI or the project intentionally exposes another
  schema to the browser.

## D021 — Separate route controllers from pure pages

- **Status:** Accepted
- **Decision:** Use the default feature dependency direction
  `routes → pages → components → primitives`. Register modules from
  `src/routes` with React Router. Route controllers own URL input, navigation,
  document metadata, workflow hooks, and async-state translation. Pages receive
  clean, typed data and callbacks through props and remain unaware of React
  Router, React Query, and Supabase.
- **Why:** A distinct route boundary makes data and navigation dependencies
  visible instead of hiding them inside files named as views. Pure pages can be
  rendered and tested with ordinary props, while URL parsing and server-state
  orchestration stay together at the highest feature layer.
- **Tradeoffs:** Even a simple screen may have a thin route module, and route
  controllers can accumulate too many prop mappings if page contracts are not
  shaped around cohesive application concepts. The extra file boundary is
  accepted for consistent ownership and testability.
- **Revisit when:** A framework-owned route convention replaces the explicit
  controller files or repeated route behavior has a clear shared abstraction
  that preserves pure page contracts.

## D022 — Orchestrate local development with Just

- **Status:** Accepted
- **Decision:** Use `just dev` as the optional one-command entry point for the
  Docker-backed Supabase stack and Vite. Resolve the running local stack's
  public URL and publishable key at startup rather than writing generated
  environment files. Keep npm scripts as the underlying commands used by Just
  and CI.
- **Seed policy:** Apply deterministic local-only users and product records on
  the first database start and on explicit reset. Ordinary startup preserves
  local database changes; `just reset` is the clearly named destructive path.
- **Why:** One command removes recurring local configuration work without
  making the task runner a hidden requirement for CI or individual tools.
  Runtime configuration cannot drift from the containers that are actually
  running, and seed data exercises ownership and membership under normal RLS.
- **Tradeoffs:** Contributors who want the convenience command must install
  Just, while Docker and the project dependencies remain prerequisites. The
  seed uses Supabase Auth's local schema and may require maintenance when a CLI
  upgrade changes that schema.
- **Revisit when:** The repository adds another local service, moves away from
  Supabase CLI, or needs an environment manager with cross-project lifecycle
  ownership.

## D023 — Make flock invitations single-use conveniences

- **Status:** Accepted
- **Decision:** Let any current flock member create multiple invitation links.
  Each link contains an opaque token, can be consumed exactly once, and expires
  24 hours after creation if it remains unused. Store only a SHA-256 token hash
  in the database and return the raw token only when the invitation is created.
- **Product boundary:** Invitations make it easy to direct a runner to the
  intended flock; they do not make flocks invitation-only. Public flock
  discovery remains a later feature. Global user discovery is not implied and
  should be designed separately with privacy and enumeration risks in mind.
- **Why:** A one-time link limits accidental forwarding and replay while the
  short lifetime bounds exposure. Allowing every member to invite matches the
  social behavior of a running group without introducing administrator roles
  before the product needs them.
- **Authorization:** Creation is exposed only through a reviewed database
  function that checks the caller's current membership. The private invitation
  table has no browser-facing grants. Acceptance hashes the supplied token and
  atomically marks an unused, unexpired row consumed while creating membership;
  client-side checks are not authoritative. Every later use—including by the
  consuming runner—receives the same unavailable result as an invalid or
  expired link.
- **Tradeoffs:** A runner whose link was already consumed or expired needs a new
  link even though the flock may eventually be discoverable through search.
  Multiple outstanding links for the same flock are allowed, so revocation and
  invitation management remain separate future product decisions.
- **Revisit when:** Flocks gain privacy modes, administrator roles, explicit
  invite revocation, longer-lived share links, or evidence that 24 hours is too
  short for real invitation behavior.

## D024 — Prefer native invitation sharing with a copy fallback

- **Status:** Accepted
- **Decision:** Offer the operating system's native share sheet when the Web
  Share API is available. Keep copy visible as the fallback on every supported
  device rather than maintaining app-specific links for Messages, WhatsApp,
  email, or other third-party applications.
- **Why:** The native share sheet exposes the applications actually installed
  on a phone without making Flock track vendor URL schemes. Copy works across
  browsers and remains the sole fallback when native sharing is unavailable.
- **Behavior:** The route controller owns browser capability detection and the
  native share call. User cancellation returns the invitation card to its idle
  state without an error. Genuine share and clipboard failures remain inline
  with an immediately available recovery action.
- **Tradeoffs:** Available destinations differ by browser, operating system,
  and installed applications. Flock cannot guarantee that a specific app will
  appear. Browsers without Web Share support offer copy only, even when the
  operating system has an email application.
- **Revisit when:** Product evidence supports a high-value app-specific share
  destination, browsers converge on a richer sharing contract, or invitations
  gain server-side delivery channels.

## D025 — Expose member identity through narrow flock-scoped profiles

- **Status:** Accepted
- **Decision:** Keep authentication records private and introduce a public
  profile containing only `user_id` and `display_name` for roster identity.
  Synchronize the display name from authentication metadata and return roster
  summaries through one security-invoker database function.
- **Authorization:** Profile Row Level Security permits a runner to read their
  own profile and profiles belonging to runners who share a flock. The roster
  function relies on the existing membership and profile policies; callers do
  not supply a user or owner identifier and never receive an email address.
- **Why:** A useful member list needs a human-readable identity, but the browser
  cannot and should not join against `auth.users`. A narrow public table keeps
  that boundary explicit, while one joined query avoids an N+1 request pattern.
- **Tradeoffs:** Authentication metadata is currently the source of the public
  name, and the neutral `Runner` fallback may not distinguish multiple people.
  Profile editing and stronger naming rules remain separate product work.
- **Revisit when:** Members can edit profiles, privacy controls distinguish
  public discovery from flockmate visibility, or richer profile fields earn a
  documented product purpose.

## D026 — Use deterministic parent navigation on nested pages

- **Status:** Accepted
- **Decision:** Show one shared, labeled back control on every nested product
  page and keep it visible across loading, not-found, failure, and successful
  states. Route controllers navigate to the route's known parent and replace
  the current entry instead of calling browser-history Back.
- **Hierarchy:** Flock creation, flock detail, and invitation acceptance return
  to the flock collection. Invitation creation returns to its flock. The flock
  collection remains top-level; sign-in and OAuth callback routes retain their
  task-specific recovery controls.
- **Why:** Mobile browser chrome is not a dependable product control, and raw
  history can point outside Flock or back into a sign-in or callback route.
  A named parent remains correct for direct links, restored authentication
  destinations, and ordinary in-app navigation.
- **Tradeoffs:** The action does not replay every intermediate route or preserve
  an arbitrary referrer. Parent destinations should therefore preserve their
  own list filters and scroll state when those capabilities are introduced.
- **Revisit when:** Nested navigation gains restorable list query state,
  multiple legitimate parents, breadcrumbs, or a router-owned origin contract.

## D027 — Let runners edit only their own public display name

- **Status:** Accepted
- **Decision:** Expose a protected profile page that reads the authenticated
  runner's profile and updates its display name through a security-definer
  database function. The page receives typed data and callbacks; URL state,
  query lifecycle, mutation state, navigation, and document metadata stay in
  the route controller.
- **Authorization:** The function derives the target user from `auth.uid()`;
  it accepts no caller-supplied user identifier and direct table writes remain
  unavailable to the browser role.
- **Why:** Runners need a safe way to correct or personalize the identity shown
  to flockmates without exposing authentication records or coupling the pure
  page to Supabase.
- **Tradeoffs:** The first version edits display name only. Broader profile
  fields, discovery visibility, and avatar storage remain separate decisions.
- **Revisit when:** Profile privacy, richer identity, or public runner search
  becomes an active product capability.

## D028 — Store only coarse runner locations

- **Status:** Accepted
- **Decision:** Extend the self-service profile with an optional city or region
  string, limited to 120 characters. Do not store precise coordinates or street
  addresses in this profile slice.
- **Why:** General location can help flockmates understand local context while
  avoiding unnecessary precision and location-tracking obligations.
- **Revisit when:** Discovery needs map-based search or runners explicitly need
  a more precise, separately consented location feature.

## D029 — Keep runner-owned events separate from flock events

- **Status:** Accepted
- **Decision:** Keep runner-owned personal events separate from flock events.
  Their creators may invite a specific runner or an entire flock, even when the
  invitees belong to different flocks. A flock audience is one seven-day
  invitation whose eligibility follows live membership until each runner
  accepts. A runner who joins while it is active becomes eligible; a runner who
  leaves before accepting loses eligibility. Acceptance creates durable event
  access for that runner even if they later leave the flock.
- **Why:** Event coordination is broader than flock administration. Sarah may
  belong to one flock and still organize a run with Gary or another flock's
  members without requiring ownership of their flock.
- **Revisit when:** Organizers need audience revocation, membership-independent
  eligibility, or expiration periods that vary by event.

## D030 — Make in-app event invitations the primary delivery path

- **Status:** Accepted
- **Decision:** Show eligible personal-event invitations inside the protected
  Events screen and let runners accept them there without opening a shared
  link. Keep audience-appropriate links as an optional delivery fallback.
- **Why:** Runners should not depend on an organizer manually delivering a link
  when Flock already knows the intended runner or flock. The persisted inbox
  also gives every supported viewport the same recoverable invitation state.
- **Tradeoffs:** An in-app inbox is visible only after a runner opens Flock. OS
  push notifications require a separate permission, subscription, delivery,
  and device-cleanup foundation and are not implied by this decision.
- **Revisit when:** The push-notification branch selects a provider and defines
  per-device permission, subscription, and delivery behavior.

## D031 — Deliver invitation alerts with standards-based Web Push

- **Status:** Accepted; code complete, hosted secrets and webhook configuration
  pending deployment
- **Decision:** Use browser push services through the Web Push standard rather
  than adding OneSignal, Firebase Messaging, or another proprietary client SDK.
  A Supabase Edge Function signs encrypted requests with VAPID and delivers to
  every subscription currently registered for the invited runner.
- **Permission behavior:** Never prompt on page load. Runners opt in from
  Settings and control the current browser or installed PWA independently.
  iPhone and iPad users must first add Flock to the Home Screen because Web Push
  is available there only to installed web apps. A denied permission remains a
  browser/device-settings recovery path rather than repeated prompts.
- **Authorization and lifecycle:** Subscription endpoints and keys stay in the
  private schema. Invitation creation queues recipient-bound jobs, later flock
  joins queue active universal invitations, and the delivery claim rechecks the
  same membership, acceptance, cancellation, event-time, and expiration rules
  as the inbox. Push-service `404` and `410` responses remove stale devices.
- **Why:** Standards-based delivery covers supported desktop browsers, Android,
  macOS Safari, and installed iPhone/iPad PWAs without adding a new analytics or
  user-data processor. It also keeps the persisted Events inbox authoritative
  instead of making a third-party notification product part of event access.
- **Tradeoffs:** Hosted deployment needs VAPID secrets plus a database webhook,
  and successful push-service delivery cannot guarantee that an operating
  system will display an alert. Browser and OS support differs, especially on
  iOS where non-installed browser tabs cannot subscribe.
- **Revisit when:** Native applications need APNs/FCM tokens, delivery volume
  warrants a managed provider, the product needs notification preferences by
  category, or operational evidence requires retries beyond the current
  idempotent job and webhook path.

## D032 — Protect flock ownership during superadmin membership removal

- **Status:** Accepted
- **Decision:** Superadmins may remove ordinary `member` records from any
  flock through a protected, idempotent database function. They cannot remove
  an `owner` membership independently of its flock.
- **Why:** Operational support needs a way to revoke an ordinary membership,
  but the owner membership mirrors the flock's canonical `owner_id`. Removing
  only one side would violate that invariant and create an ownerless or
  internally inconsistent flock. Deleting the flock remains the existing
  explicit path when the whole group must be removed.
- **Tradeoffs:** A removed member can rejoin through a later valid invitation,
  and this slice does not add ownership transfer, membership suspension, or an
  audit log. Removal revokes flock-derived access but does not delete the
  runner account or independently retained personal-event access.
- **Revisit when:** Ownership transfer, multiple flock administrators,
  temporary suspension, or formal moderation audit requirements become active
  product needs.

## D033 — Keep primary routes eager and lazy-load secondary workflows

- **Status:** Accepted
- **Decision:** Keep the application shell, protected-session boundary,
  sign-in, OAuth callback, and default flock collection in the entry graph.
  Load secondary route controllers through React Router's `lazy` route
  property while keeping every path and index definition static.
- **Why:** Static paths preserve immediate matching, direct links, and saved
  authentication destinations. Deferring secondary implementations removes
  unrelated pages, hooks, and mutations from startup without adding a custom
  route-discovery system or delaying the most common landing workflow.
- **Tradeoffs:** The first visit to a secondary route requires its generated
  chunk. The service worker still precaches those chunks, so this primarily
  reduces initial parsing and execution rather than the eventual installed-PWA
  cache size.
- **Revisit when:** Navigation measurements justify preloading a frequent
  secondary route, chunk fragmentation becomes material, or the default
  landing workflow changes.

## D034 — Complete cohesive outcomes in independently reviewable branches

- **Status:** Accepted project workflow
- **Decision:** Organize each branch around one clear, independently reviewable
  outcome. Prefer a reasonably sized vertical slice that includes every
  relevant database, data-access, application, UI, test, and documentation
  change needed to complete that outcome. Exclude opportunistic cleanup,
  unrelated refactors, and separate product outcomes. The project owner
  normally creates commits and pushes; automated assistance must not commit or
  push without explicit permission.
- **Why:** Artificially splitting one outcome by implementation layer creates
  extra pull-request overhead, leaves intermediate branches incomplete, and
  slows progress without improving the review boundary. A complete vertical
  slice makes the behavior, authorization, interface, and verification visible
  together while retaining a clear purpose and reversible history.
- **Tradeoffs:** Individual diffs may be larger and require more deliberate
  organization, proportional verification, and a concise explanation of the
  branch's single outcome. Cohesion, not raw line count, determines scope.
- **Revisit when:** Branches routinely mix unrelated outcomes, reviews become
  difficult to complete safely, or team and release needs call for a different
  workflow with equivalent review boundaries.

## D035 — Snapshot flock-event alert audiences at each change

- **Status:** Accepted; code complete, hosted Edge Function and webhook update
  pending deployment
- **Decision:** Queue one Web Push job for every current flock member other than
  the actor whenever a future flock event is created, materially updated, or
  canceled. Recheck membership at delivery, skip runners who left, and do not
  add historical jobs for runners who join after the change. A superadmin
  cancellation includes all current members because the administrator is not a
  flock audience member.
- **Delivery behavior:** Keep immutable flock-event activity separate from the
  per-recipient job. Suppress an undelivered create or update when newer
  activity already exists for the same event, use one replacement notification
  tag per event, and deep-link to `/flocks/:flockId#flock-events`. The flock
  detail remains the durable source of truth; no notification center or
  real-time transport is introduced.
- **Why:** Event changes are useful only to the audience that existed when the
  organizer acted. A point-in-time fan-out avoids replaying stale operational
  messages to new members, while the delivery-time membership check prevents
  leaking event details to runners who have left.
- **Tradeoffs:** A runner who joins after an event is created discovers it in
  flock detail rather than receiving the original alert. Push remains
  best-effort, and multiple rapid changes may collapse to the most recent
  meaningful state instead of preserving an alert history.
- **Revisit when:** Product research calls for historical in-app notifications,
  scheduled reminders, RSVP alerts, per-category preferences, or chat and
  direct-message notifications.

## D036 — Keep flock run options organizer-defined and response-bound

- **Status:** Superseded by D037 for option values; response binding and stable
  identifiers remain accepted
- **Decision:** Require one to eight ordered distance-and-pace options on every
  newly created or edited flock event. Store both values as concise labels with
  stable option identifiers. Require runners choosing “I’m in” or “Maybe” to
  select one option; clear the option for “I’m out.” Keep pre-existing events
  without options valid until an organizer edits them.
- **Why:** A flock event needs to communicate the actual plans runners can join,
  and an aggregate RSVP count cannot tell an organizer how each distance or pace
  group is shaping up. Organizer-written labels support miles, kilometers,
  time-based runs, and conversational descriptions without prematurely defining
  conversion, pace, or route models.
- **Deletion behavior:** Removing an option does not delete attendance. The
  database clears that option reference and the interface identifies earlier
  in/maybe responses that need a new choice.
- **Tradeoffs:** Labels are not normalized for analytics, runners cannot propose
  options, and personal events retain the simpler aggregate RSVP model. Editing
  a legacy event requires bringing it into the current option model.
- **Revisit when:** Moderated use shows a need for structured units, reusable
  pace groups, capacity limits, mapped routes, or the same option model on
  personal events.

## D037 — Structure distance and pace with a shared-unit wheel

- **Status:** Accepted
- **Decision:** Replace free-text run-option entry with numeric distance and
  pace values plus one shared miles-or-kilometers unit for flock and personal
  events. Offer distance from 0.1
  through 100 in tenth-unit steps, mile pace from 4:00 through 15:00, and
  kilometer pace from 2:30 through 9:30 in five-second steps. Use an authored
  dark multi-column wheel with a centered selection band, faded neighboring
  values, inertial touch scrolling, and keyboard-operable spin controls.
  Changing miles or kilometers changes both distance and pace; the server also
  rejects any stored state in which those units differ.
- **Compatibility:** Keep existing label columns as derived display values and
  as a read-only fallback for options created before this decision. Do not
  invent structured values for those rows. Editing an older option surfaces its
  previous labels and requires review before the structured replacement is
  saved.
- **Why:** Free text produces inconsistent distances and pace descriptions,
  makes common choices slower on a phone, and prevents deterministic validation
  or later unit-aware behavior. A maintained unstyled wheel primitive supplies
  the desired mobile interaction while Flock owns the visual treatment and
  augments each column with explicit spinbutton semantics.
- **Tradeoffs:** Tenth-unit distance and five-second pace increments intentionally
  exclude arbitrary values and conversational pace names. Switching units
  converts to the nearest supported equivalent, so a round trip may differ by a
  few seconds.
- **Revisit when:** Moderated use shows a need for finer distance increments,
  named effort groups, or distance ranges beyond 100 units.

## D038 — Store privacy-minimized GPX routes on run options

- **Status:** Accepted
- **Decision:** Allow one optional GPX route on each structured run option for
  personal and flock events. Parse GPX in the browser, keep the longest track
  segment or route, calculate its distance, simplify it to at most 1,000
  longitude/latitude pairs, and store only that normalized line and distance.
  Do not retain the source file, filename, timestamps, elevation, author, or
  device metadata. Protect route reads through the option's existing
  event-aligned Row Level Security.
- **Map delivery:** Render with demand-loaded MapLibre GL JS and OpenFreeMap's
  hosted Liberty style. Keep normalized geometry provider-neutral so the
  basemap can be replaced without migrating event routes. Exclude the large map
  renderer and worker chunks from PWA precaching.
- **Why:** Different distance groups may follow different courses, so the route
  belongs to the option rather than the event. GPX import works with existing
  watch and route-planning exports without requiring a provider account, while
  metadata minimization avoids storing unrelated activity history.
- **Tradeoffs:** Import does not draw, edit, snap, or merge routes. OpenFreeMap
  is a public third-party basemap with no application-specific service-level
  agreement, and map backgrounds require connectivity even though route data
  remains stored in Flock. Basemap tile requests necessarily disclose the map
  area to OpenFreeMap and its CDN; the provider currently states that ordinary
  access logs omit IP addresses, while error or temporary security logs may
  retain them for a limited period. Precise route geometry is visible to every
  person authorized to read the event.
- **Revisit when:** Creators need route drawing or provider integrations,
  offline maps, turn cues, elevation profiles, multiple segments, or usage
  requires a paid or self-hosted tile service.

## D039 — Draw provider-neutral routes with walking-road routing

- **Status:** Accepted
- **Decision:** Let personal- and flock-event creators place up to 25 ordered
  points on the existing MapLibre map. Use Geoapify's public browser Routing
  API in walking and shortest-route modes to connect each new point to the
  previous point. Event-location geocoding may center the initial view but is
  best effort. Keep GPX import as an independent fallback.
- **Data boundary:** Merge successful segments, reduce the result to the
  existing 1,000-coordinate limit, and persist only the normalized line and
  estimated distance already supported by each run option. Do not retain
  draft waypoints, geocoding results, provider identifiers, or directions.
- **Configuration:** Supply the public routing key as
  `VITE_GEOAPIFY_API_KEY` and restrict it to Flock's allowed browser origins.
  If it is absent, explain that drawing is unavailable without disabling GPX
  import or saved route viewing.
- **Why:** Organizers can plan a useful course without first creating or
  exporting a GPX file. A segment-at-a-time draft makes failure recovery,
  Undo, and Clear predictable while keeping the stored route portable.
- **Tradeoffs:** Route planning and initial centering require connectivity and
  consume an external provider quota. Drawing sends the entered event location
  and selected waypoint coordinates to Geoapify. Saved routes cannot restore
  editable waypoints; replacing one starts a new draft. Walking mode favors
  pedestrian access but does not guarantee local event suitability or safety,
  so the creator remains responsible for reviewing the course.
- **Revisit when:** Usage requires provider-independent routing, private
  server-side keys, offline drawing, editable saved waypoints, route loops,
  turn cues, elevation, surface data, or stronger route-safety review.

## D040 — Copy reusable routes into a private runner library

- **Status:** Accepted
- **Decision:** Let an authenticated runner save up to 100 named routes in a
  private library, preview and reuse them in personal or flock events, rename
  them, and delete them. Applying a saved route copies its normalized geometry
  and calculated distance into the event draft rather than linking the event to
  the library row.
- **Authorization:** Derive ownership from `auth.uid()` in protected database
  functions. Expose owner-only reads through Row Level Security and do not
  grant direct table writes to browser clients.
- **Why:** Organizers often repeat courses. Copy semantics keep event history
  stable and make library cleanup safe: renaming or deleting a reusable route
  never changes an event that already uses it.
- **Tradeoffs:** Updates to a saved route do not propagate to events, duplicate
  names are rejected case-insensitively, and the library stores no editable
  waypoints, pace, directions, elevation, or source GPX metadata.
- **Revisit when:** Runners need route sharing, folders or tags, full geometry
  editing, usage history, organization-owned routes, or deliberate propagation
  of route revisions.

## D041 — Repeat events as independent creates

- **Status:** Accepted
- **Decision:** Let personal-event creators and flock organizers repeat an
  existing event by preloading its title, location, description, run options,
  and copied route geometry into the ordinary create form. Require a new date
  and remove the original event and run-option identifiers before submission.
- **Boundary:** Never copy invitations, responses, attendance, creation
  metadata, or cancellation state. Use the existing authorized create
  mutations so transactions, query refresh, and notification behavior remain
  unchanged.
- **Why:** Recurring runs usually reuse a plan but represent a new gathering
  with a new audience response. Treating repetition as creation makes that
  boundary visible in the interface and prevents historical participation from
  leaking into the next run.
- **Tradeoffs:** The organizer still reviews and submits the complete form, and
  there is no recurring-series object or automatic schedule. A copied route is
  independent of both the source event and the saved-route library.
- **Revisit when:** Organizers need recurring schedules, bulk edits, series
  cancellation, inherited audiences, or explicit links between occurrences.

## D042 — Keep flock chat member-only with durable cursor history

- **Status:** Accepted
- **Decision:** Give each flock one plain-text message stream available only to
  current members. Persist messages in PostgreSQL, authorize reads with Row
  Level Security, and accept writes only through a protected function that
  derives the sender and rechecks membership. Administrative flock access does
  not grant a nonmember access to private chat.
- **History and delivery:** Read deterministic `(created_at, id)` cursor pages
  and present them as upward infinite scroll with no page controls. Use filtered
  Supabase Realtime inserts for immediate delivery, while treating persisted
  history as authoritative after refresh, reconnect, or a missed update.
- **Why:** Flocks need a lightweight place to coordinate runs without moving to
  another app. Cursor loading keeps long histories stable as new messages arrive,
  and membership-aligned authorization matches the private group boundary.
- **Tradeoffs:** Membership loss immediately removes history and send access.
  The first increment has no direct messages, attachments, edits, deletion,
  reactions, typing indicators, read receipts, moderation tools, or push alerts.
- **Revisit when:** Real use requires retention controls, moderation, media,
  message lifecycle actions, unread counts, device alerts, or one-to-one chat.

## D043 — Put the conversation directory in the application sidebar

- **Status:** Accepted
- **Decision:** Move flock chat out of flock detail into `/chats` and
  `/chats/:flockId` routes, but do not add a generic Chats item to primary
  navigation. Instead, present current flock conversations as a Flock chats
  group directly in the persistent desktop sidebar and mobile navigation
  drawer, like group channels. Keep a clearly separated Direct messages
  section for one-to-one conversations. Let the selected conversation
  consume the available desktop canvas rather than the narrow content width
  used by forms and detail pages.
- **Authorization:** Populate the flock-chat list through a protected database
  function that derives the runner from `auth.uid()` and returns only current
  memberships. Broader superadmin flock visibility must not reveal private
  conversation destinations.
- **Why:** Messaging is becoming a recurring product activity rather than flock
  metadata, but an extra generic destination adds a redundant step. Exposing
  conversation destinations directly gives future one-to-one messages a
  natural home without forcing another redesign or mixing private messaging
  permissions with administration.
- **Tradeoffs:** The panel lists names only; it has no unread counts, last
  message previews, or ordering by activity. On phones,
  the list and selected thread are separate views instead of simultaneous
  columns.
- **Revisit when:** Real usage justifies unread state, previews, pinning, or
  activity ordering.

## D044 — Model one canonical private conversation per runner pair

- **Status:** Accepted
- **Decision:** Store each direct conversation as one deterministic ordered pair
  of distinct profile identifiers with a unique constraint. Let any
  authenticated runner search for another runner and ask a protected function
  to get or create that pair. Restrict conversation lists, message history,
  sends, Realtime hydration, and participant profile visibility to exactly the
  two participants.
- **Why:** A canonical pair prevents duplicate threads and gives runner-to-runner
  coordination a stable destination without exposing client-selected ownership.
  Reusing the proven cursor, composer, and Realtime machinery keeps flock and
  direct chat behavior consistent while authorization remains domain-specific.
- **Tradeoffs:** Starting a conversation does not require acceptance, and the
  first version has no blocking, reporting, deletion, unread state, previews,
  activity ordering, read receipts, typing indicators, attachments, or push
  alerts. Conversation records remain even when they have no messages.
- **Revisit when:** Safety evidence requires an invitation or blocking model,
  or message volume justifies server-backed unread and activity summaries.
