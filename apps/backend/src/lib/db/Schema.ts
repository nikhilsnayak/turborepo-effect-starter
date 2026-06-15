import { snakeCase, timestamp, text, boolean } from 'drizzle-orm/pg-core';

const createdAt = timestamp({ withTimezone: true, mode: 'string' }).notNull().defaultNow();
const updatedAt = timestamp({ withTimezone: true, mode: 'string' })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date().toISOString());

export const Todos = snakeCase.table('todos', {
  id: text()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  title: text().notNull(),
  completed: boolean().notNull().default(false),
  createdAt,
  updatedAt,
});
