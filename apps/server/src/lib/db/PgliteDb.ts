import * as BunServices from '@effect/platform-bun/BunServices';
import * as PgliteClient from '@effect/sql-pglite/PgliteClient';
import * as PgliteDrizzle from 'drizzle-orm/effect-pglite';
import { migrate } from 'drizzle-orm/effect-pglite/migrator';
import { Effect, FileSystem, Layer } from 'effect';
import { inject } from 'vitest';

import { DbService } from './DbService.ts';
import { migrationConfig } from './MigrationConfig.ts';
import { relations } from './Relations.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    readonly pgliteMigratedDataDir: string;
  }
}

const extensions = {};

export const buildMigratedDataDir = Effect.gen(function* () {
  const db = yield* PgliteDrizzle.makeWithDefaults({ relations, jit: true });
  yield* migrate(db, migrationConfig);
  const client = yield* PgliteClient.PgliteClient;
  return yield* client.dumpDataDir('none');
}).pipe(Effect.provide(PgliteClient.layer({ extensions })), Effect.orDie);

export const PgliteDbLayer = Layer.unwrap(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const migrated = yield* fs.readFile(inject('pgliteMigratedDataDir'));
    return Layer.effect(DbService, PgliteDrizzle.makeWithDefaults({ relations, jit: true })).pipe(
      Layer.provide(PgliteClient.layer({ extensions, loadDataDir: new Blob([migrated]) })),
    );
  }),
).pipe(Layer.provide(BunServices.layer), Layer.orDie);
