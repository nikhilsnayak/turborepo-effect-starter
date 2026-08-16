## Dependencies

- No `devDependencies`; shared versions use the root catalog and `catalog:`.
- `apps/mobile` must pin Expo's `react`, `react-native`, and `@types/react` versions.

## References

- `repos/` contains read-only references. Never edit or import from them; prefer them over web
  sources.
- Read `repos/effect/LLMS.md` before writing Effect code.

## Code

- Import features from `@repo/<pkg>/modules/<feature>`, never package roots. Use direct-file exports
  for single-file modules and barrels only for real aggregates.
- React Compiler is enabled; avoid manual memoization without measured need.
- Use path-qualified Effect service identifiers, named `Effect.fn` operations, `*Layer` layer names,
  and `layerTest` for reusable fakes.

## Verify

Run `bun run check`, `bun run test`, and `bun run build` from the repository root.
