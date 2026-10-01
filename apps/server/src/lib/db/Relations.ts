import { defineRelations } from 'drizzle-orm';

import * as schema from './Schema.ts';

export const relations = defineRelations(schema, () => ({}));
export type Relations = typeof relations;
