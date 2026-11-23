import { type EffectPgQueryEffectHKT } from 'drizzle-orm/effect-postgres';
import { type PgEffectDatabase } from 'drizzle-orm/pg-core/effect';
import { type PgQueryResultHKT } from 'drizzle-orm/pg-core/session';
import { Context } from 'effect';

import { type Relations } from './Relations.ts';

export class DbService extends Context.Service<
  DbService,
  PgEffectDatabase<EffectPgQueryEffectHKT, PgQueryResultHKT, Relations>
>()('@repo/server/Db/DbService') {}
