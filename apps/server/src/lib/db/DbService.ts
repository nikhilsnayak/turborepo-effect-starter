import { type EffectPgDatabase } from 'drizzle-orm/effect-postgres';
import { Context } from 'effect';

import { type Relations } from './Relations.ts';

export class DbService extends Context.Service<DbService, EffectPgDatabase<Relations>>()(
  '@repo/server/Db/DbService',
) {}
