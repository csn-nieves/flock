# Flock

## Project documentation

- [Product foundation](./PRODUCT.md)
- [Technical foundation](./TECHNICAL.md)
- [Design system](./DESIGN.md)
- [System design and build journal](./docs/README.md)

## Local development

Install dependencies and create a local environment file:

```sh
npm install
cp .env.example .env.local
```

Replace the placeholder values in `.env.local` with the project URL and publishable key from the Supabase project settings, then start Vite:

```sh
npm run dev
```

Variables prefixed with `VITE_` are included in the browser bundle. Only the
Supabase project URL and publishable key belong there; secret and service-role
keys must never be added to the frontend environment.

## Local database development

Flock's database schema is tracked in `supabase/migrations`. With Docker running,
start the local Supabase stack and display its service URLs with:

```sh
npm run db:start
npm run db:status
```

Open the Studio URL printed by `db:status` to inspect local tables, policies,
authentication, and data. Verify the migrations and pgTAP authorization tests
from a clean local database with:

```sh
npm run db:verify
```

`db:verify` resets only the local database before testing it. Run
`npm run db:stop` when the local Supabase services are no longer needed.

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
