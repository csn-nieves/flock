# Flock decision log

Last reviewed: 2026-09-29

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

- **Status:** Accepted
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

- **Status:** Accepted; email and social initiation implemented, social UI and
  callback handling pending
- **Decision:** Offer a six-digit email code plus Google and Facebook through
  Supabase OAuth with PKCE.
- **Why:** A code avoids password creation and recovery. It also keeps an
  installed-PWA user inside Flock instead of requiring a magic-link handoff.
  Social providers reduce friction for users who prefer them.
- **Tradeoffs:** Email delivery and rate limits become part of the experience.
  OAuth adds provider configuration, callback validation, and destination
  restoration.
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
  and production build as distinct GitHub Actions jobs.
- **Why:** A failing check identifies its layer immediately, and independent jobs
  can run in parallel. Device matrices make Chromium- and WebKit-specific
  failures visible.
- **Tradeoffs:** Each browser job repeats checkout, installation, and browser
  setup. Parallel clarity currently matters more than minimizing runner work.
- **Revisit when:** CI duration or cost becomes significant enough to justify
  caching, sharding, or a different matrix.

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

## D014 — Add React Query with the first server-data query

- **Status:** Planned
- **Decision:** Use React Query through domain-specific custom hooks for flock,
  membership, and event server state. Do not add it solely for authentication
  mutations already coordinated by Supabase and the auth controller.
- **Why:** Query caching, invalidation, retry, and shared loading state will
  matter when pages begin reading backend records. Delaying installation avoids
  adding an unused abstraction.
- **Tradeoffs:** The first data feature must establish query-key and invalidation
  conventions before other features copy an accidental pattern.
- **Revisit when:** The first flock data query begins.

## D015 — Develop in small branches without automated commits

- **Status:** Accepted project workflow
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
