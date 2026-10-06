default:
    @just --list

# Start local Supabase, then run Vite with its public browser configuration.
dev:
    npm run db:start
    node scripts/start-local-development.mjs

# Rebuild the local database from migrations and deterministic seed data.
reset:
    npm run db:start
    @echo "Resetting the local database and reloading seed data..."
    npm run db:reset

# Show local Supabase service URLs, including Studio and Mailpit.
status:
    npm run db:status

# Stop local Supabase while preserving its Docker data volume.
stop:
    npm run db:stop

# Run the repository verification suite.
check:
    npm run format:check
    npm run lint
    npm run typecheck
    npm test
    npm run build
    npm run test:components
    npm run test:pages
    npm run test:e2e
    npm run db:verify
