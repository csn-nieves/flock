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

Flock's database schema is tracked in `supabase/migrations`. With Docker running
and the Supabase CLI installed, recreate the local database and run its pgTAP
authorization tests with:

```sh
supabase start
supabase db reset
supabase test db
```

Do not make application schema changes directly in the hosted dashboard. Create
and test a migration first; deployment of migrations to the hosted project is a
separate, deliberate step.
