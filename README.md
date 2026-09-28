# Turborepo Effect Starter

A Bun/Turborepo starter with an Effect RPC server, React web app, and Expo mobile app.

## Run locally

1. Run `bun install`.
2. From a clean, committed worktree, run `bun run vendor:sync effect` to add the Effect source under
   `vendor/effect`.
3. Copy the `.env.example` file in each app to `.env` and set the values for your machine.
4. Start PostgreSQL with `docker compose -f apps/server/docker-compose.yml up -d`.
5. Run `bun run --cwd apps/server db:migrate`.
6. Run `bun run dev`.
