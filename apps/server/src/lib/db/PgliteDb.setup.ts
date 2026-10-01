import * as BunServices from '@effect/platform-bun/BunServices';
import { Effect, FileSystem, Path } from 'effect';
import { type TestProject } from 'vitest/node';

import { buildMigratedDataDir } from './PgliteDb.ts';

const writeMigratedDataDir = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dataDir = yield* buildMigratedDataDir;
  const bytes = yield* Effect.promise(() => dataDir.arrayBuffer());
  const directory = yield* fs.makeTempDirectory({ prefix: 'starter-pglite-' });
  const file = path.join(directory, 'migrated.tar');
  yield* fs.writeFile(file, new Uint8Array(bytes));
  return { directory, file };
});

const removeDirectory = (directory: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    yield* fs.remove(directory, { recursive: true });
  }).pipe(Effect.provide(BunServices.layer), Effect.ignore, Effect.runPromise);

export default (project: TestProject) =>
  writeMigratedDataDir.pipe(
    Effect.map(({ directory, file }) => {
      project.provide('pgliteMigratedDataDir', file);
      return () => removeDirectory(directory);
    }),
    Effect.provide(BunServices.layer),
    Effect.orDie,
    Effect.runPromise,
  );
