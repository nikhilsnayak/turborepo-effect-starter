import { layerConfig as pgClientLayerConfig } from '@effect/sql-pg/PgClient';
import { defineRelations } from 'drizzle-orm';
import * as PgDrizzle from 'drizzle-orm/effect-postgres';
import { Context, Effect, Layer } from 'effect';
import * as Config from 'effect/Config';

import * as schema from './Schema.ts';

const relations = defineRelations(schema, () => ({}));

const PgClientLive = pgClientLayerConfig({
  url: Config.redacted('DATABASE_URL'),
});

export class DbService extends Context.Service<DbService>()('@workspace/server/DbService', {
  make: PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices)),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(PgClientLive));
}
