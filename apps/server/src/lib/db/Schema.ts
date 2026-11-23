import { TodoId } from '@repo/contracts/modules/Todo';
import { sql } from 'drizzle-orm';
import { boolean, customType, snakeCase, text } from 'drizzle-orm/pg-core';
import { DateTime } from 'effect';

const table = snakeCase.table;

const dateTimeColumn = customType<{
  data: DateTime.Utc;
  driverData: string;
  driverOutput: Date;
  jsonData: string;
}>({
  dataType: () => 'timestamp with time zone',
  toDriver: DateTime.formatIso,
  fromDriver: DateTime.fromDateUnsafe,
  fromJson: DateTime.makeUnsafe,
  codec: 'timestamptz',
});

const createdAt = () =>
  dateTimeColumn()
    .notNull()
    .default(sql`now()`);
const updatedAt = () => createdAt().$onUpdate(DateTime.nowUnsafe);

export const Todos = table('todos', {
  id: text()
    .$type<TodoId>()
    .primaryKey()
    .$defaultFn(() => TodoId.make(Bun.randomUUIDv7())),
  title: text().notNull(),
  completed: boolean().notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
