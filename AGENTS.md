## Runtime / Package Manager

The project uses bunjs as both package manager and runtime

## Dependency Management

All the dependencies are treated as normal dependencies. No package should be installed as a dev dependency. If a dependency is used in multiple packages of the monorepo workspace, it should listed in the catalog of root package.json and the catalog version should be used by the packages using the `catalog:*` protocol

## Vendored Repositories

This project vendors external repositories under @repos/

- Use vendored repositories as read-only reference material when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do not edit files under @repos/ unless explicitly asked
- Do not import from @repos/ - application code should continue importing from normal package dependencies

## File Naming

- Frontend app (`apps/app`): kebab-case (e.g. `app-client.ts`, `todo-list.tsx`).
- Backend (`apps/backend`) and shared packages: PascalCase (e.g. `TodoService.ts`, `Schemas.ts`).
- Framework- or tool-generated files keep their mandated names (e.g. TanStack Router's `routes/index.tsx`, `__root.tsx`, `routeTree.gen.ts`, and entry files like `index.ts` / `main.tsx`).

## Frontend Modules

Each feature lives under `apps/app/src/modules/<feature>/`:

- `atoms.ts` — the data layer (RPC-backed query/mutation atoms).
- `components/` — small, single-purpose components.

The route component (under `apps/app/src/routes/`) is the composition of a module's components: it owns layout and wiring, while the components in `components/` stay small and contained.

## Effect

Always read @repos/effect/LLMS.md before writing any Effect code. Inspect @repos/effect/ for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns.


