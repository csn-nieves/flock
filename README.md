# Flock

Flock is a mobile-first progressive web app for run clubs. Organizers create
**flocks**, plan personal or group runs, define distance and pace options,
share GPX or road-following routes, manage RSVPs, and keep members connected
through private flock chats and direct messages.

The app also supports profile, flock, and event photos, saved routes, event
invitations, realtime updates, and opt-in Web Push notifications. The goal is
to give runners one calm, practical place to decide where and when to run
together.

## Built with

- React, TypeScript, Vite, React Router, and Tailwind CSS
- Supabase PostgreSQL, Auth, Row Level Security, Realtime, Storage, and Edge Functions
- Geoapify Routing API for road-following routes drawn in the browser
- Standards-based Web Push with a custom PWA service worker
- Cloudflare Pages for hosting and Namecheap for the production domain
- Vitest, Playwright, and pgTAP for unit, browser, end-to-end, and database coverage

## Run locally

Prerequisites: Node.js, Docker, the Supabase CLI, and [Just](https://just.systems/).

```sh
npm install
just dev
```

`just dev` starts local Supabase, applies migrations, loads the curated seed
data, starts Vite, and prints the local URLs. Open the app at the printed Vite
URL. Use `runner@flock.com` or `organizer@flock.com`; read the six-digit email
code in the Mailpit URL shown by `just status`.

Reset local data and regenerate the media fixtures with:

```sh
just reset
```

Stop the local stack with `just stop`.

For route drawing, set `VITE_GEOAPIFY_API_KEY` to a browser-restricted
Geoapify key. The local Supabase public URL and publishable key are supplied by
`just dev`; never put service-role keys or other secrets in Vite variables.

## Demo without signing up

Choose **Explore the demo** on the sign-in screen. Flock creates an anonymous
Supabase session and provisions a curated demo workspace with six distinct
flocks, upcoming route-backed group and personal events, and realistic flock
chat history from six isolated demo runners. Each runner has a distinct profile,
flock participation, and avatar mapping. The workspace includes several direct
conversations with individually authored longer histories, flock-specific
topics, varied reactions, and persisted RSVP examples. Demo sessions also receive curated
profile, flock, and event imagery
from the app bundle when a private storage object has not been created for that
temporary workspace. The workspace is created by the database function itself,
so it does not depend on production seed data. It is isolated and idempotent
for that demo session.

Anonymous sign-ins are enabled automatically in local development. For a
hosted environment, enable **Supabase → Authentication → Sign-in / Providers
→ Anonymous sign-ins** first. Demo sessions are separate from email, Google,
and Facebook accounts and should not be used for real data.

## Production

The deployed app is available at **[flockrun.fit](https://flockrun.fit)**.
Cloudflare Pages hosts the frontend, while the production Supabase project
provides authentication, database, storage, realtime, and server-side
functions. The Cloudflare Pages preview remains available at
`https://flock-validation.pages.dev` for validation work.

Production setup requires:

1. Configure the frontend’s public `VITE_` values in Cloudflare Pages,
   including the Supabase URL, publishable key, Web Push public key, and (when
   route drawing is enabled) the Geoapify browser key.
2. Set the Supabase Auth Site URL and redirect allow-list entries for
   `https://flockrun.fit/auth/callback` and the local or preview origins used
   for testing.
3. Apply committed migrations to the intended Supabase project after reviewing
   the dry run:

   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --dry-run
   npx supabase db push
   ```

4. Configure production SMTP, Web Push VAPID secrets, the notification Edge
   Function, and its database webhook when device alerts are needed.

Do not use `--include-seed` against the hosted project; the seed contains local
development identities and fixtures. Keep service-role credentials in
Supabase or Cloudflare server-side configuration only.

## Project documentation

- [Current state](./docs/CURRENT_STATE.md) — active milestone and next step
- [Product foundation](./PRODUCT.md) — users, scope, and product principles
- [Technical foundation](./TECHNICAL.md) — architecture and security boundaries
- [Design system](./DESIGN.md) — visual language and design tokens
- [Engineering notes](./docs/README.md) — system design, decisions, and build journal
- [Repository instructions](./AGENTS.md) — contribution and verification rules
