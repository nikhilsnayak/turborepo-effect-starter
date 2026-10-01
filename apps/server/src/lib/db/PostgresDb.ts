import * as PgClient from '@effect/sql-pg/PgClient';
import * as PgDrizzle from 'drizzle-orm/effect-postgres';
import { Config, Layer } from 'effect';

import { DbService } from './DbService.ts';
import { relations } from './Relations.ts';

export const PostgresDbLayer = Layer.effect(
  DbService,
  PgDrizzle.makeWithDefaults({ relations, jit: true }),
).pipe(Layer.provide(PgClient.layerConfig({ url: Config.Redacted('DATABASE_URL') })));
