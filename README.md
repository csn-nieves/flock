# Flock

## Project documentation

- [Codex repository instructions](./AGENTS.md)
- [Current development state](./docs/CURRENT_STATE.md)
- [Product foundation](./PRODUCT.md)
- [Technical foundation](./TECHNICAL.md)
- [Design system](./DESIGN.md)
- [System design and build journal](./docs/README.md)

## Local development

Install the project dependencies and
[Just](https://just.systems/man/en/packages.html), then make sure Docker is
running. Start the complete local application with:

```sh
npm install
just dev
```

`just dev` starts the local Supabase stack, reads its public API URL and
publishable key, and passes only those values to Vite. It does not create or
modify `.env.local`. The first local database start applies the migrations and
loads deterministic development data.

Sign in as `runner@flock.com` and open the Mailpit URL shown by
`just status` to read the six-digit local sign-in code. This account owns two
sample flocks and belongs to a third. `organizer@flock.com` is also available
for testing the other owner.

Stop Vite with `Control-C`. Supabase stays available so the next startup is
fast. Stop its containers separately when they are no longer needed:

```sh
just stop
```

Variables prefixed with `VITE_` are included in the browser bundle. The
Supabase project URL and publishable key belong there; secret and service-role
keys must never be added to the frontend environment.

The Web Push public key is also safe browser configuration and belongs in
`VITE_WEB_PUSH_PUBLIC_KEY`. Its paired private key must remain an Edge Function
secret.

## Event invitation push deployment

The repository contains the subscription schema, notification jobs, custom
service worker, and `send-event-invitation-notification` Edge Function. A hosted
environment needs one-time VAPID and webhook configuration before it can send
alerts:

1. Generate one VAPID key pair, for example with
   `npx web-push generate-vapid-keys`. Keep the private key out of Git.
2. Set the public key as `VITE_WEB_PUSH_PUBLIC_KEY` in the frontend build
   environment.
3. Set `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT` as
   Supabase Edge Function secrets. The subject must be an HTTPS URL or a
   `mailto:` contact owned by the project.
4. Deploy `send-event-invitation-notification` after deploying its database
   migration.
5. Create a Supabase Database Webhook for `INSERT` and `UPDATE` events on
   `private.event_invitation_notification_jobs`. Target the Edge Function with
   `POST`, keep `Content-Type: application/json`, and add the service-role
   authorization header. Updates are required because opting in can requeue a
   still-active invitation that previously had no device subscription.

The function has platform JWT verification disabled because database webhooks
do not carry an end-user session. It performs its own exact service-role bearer
check before claiming a private, idempotent job. Do not configure the webhook
with a public or anonymous credential.

## Local database development

Flock's database schema is tracked in `supabase/migrations`, and development
fixtures are tracked in `supabase/seed.sql`. Rebuild the local database from
both sources when you need a known state:

```sh
just reset
```

This command deletes local database changes before replaying migrations and
seed data. It never targets the hosted project. Use `just status` to display
the local Studio and Mailpit URLs.

The underlying npm commands remain available for CI and environments without
Just. Verify the migrations and pgTAP authorization tests from a clean local
database with:

```sh
npm run db:verify
```

`db:verify` resets only the local database before testing it. Run the complete
repository verification suite with `just check`.

Run the full-stack browser journeys against real local Supabase sessions, RPCs,
Row Level Security, and persisted data with:

```sh
npm run test:e2e
```

This command starts Supabase if needed, resets only the local database to the
committed migrations and seed, starts the application with local public
configuration, and runs the organizer-to-runner flock membership, flock event,
and personal-event invitation journeys in desktop Chromium. It never targets a
hosted project. Use the regular page-test matrix for responsive browser
coverage; the full-stack suite owns the frontend-to-database integration
boundary.

After changing the public database schema, regenerate the frontend's TypeScript
definitions from the running local database:

```sh
npm run db:types
```

Commit `src/types/database.ts` so CI and other contributors use the same schema
contract. The file is generated and must not be edited manually.

Do not make application schema changes directly in the hosted dashboard. Create
and test a migration first; deployment of migrations to the hosted project is a
separate, deliberate step.
