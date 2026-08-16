import { type TodoId } from '@repo/contracts';
import { eq, sql } from 'drizzle-orm';
import { Context, Effect, Layer, Option } from 'effect';

import { DbService, Todos } from '@/lib/db';

export class TodoRepository extends Context.Service<TodoRepository>()(
  '@repo/server/modules/todo/TodoRepository',
  {
    make: Effect.gen(function* () {
      const db = yield* DbService;

      const findAll = Effect.fn('TodoRepository.findAll')(() =>
        db.query.Todos.findMany({ orderBy: { createdAt: 'desc' } }),
      );

      const create = Effect.fn('TodoRepository.create')((title: string) =>
        db
          .insert(Todos)
          .values({ title })
          .returning()
          .pipe(Effect.map((rows) => Option.fromNullishOr(rows[0]))),
      );

      const toggle = Effect.fn('TodoRepository.toggle')((todoId: TodoId) =>
        db
          .update(Todos)
          .set({ completed: sql`NOT ${Todos.completed}` })
          .where(eq(Todos.id, todoId))
          .returning()
          .pipe(Effect.map((rows) => Option.fromNullishOr(rows[0]))),
      );

      const remove = Effect.fn('TodoRepository.remove')((todoId: TodoId) =>
        db
          .delete(Todos)
          .where(eq(Todos.id, todoId))
          .returning({ id: Todos.id })
          .pipe(Effect.map((rows) => rows.length > 0)),
      );

      return { findAll, create, toggle, remove };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly layerTest = Layer.mock(this);
}
