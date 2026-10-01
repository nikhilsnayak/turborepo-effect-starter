import { type TodoId, TodoNotFound } from '@repo/contracts/modules/Todo';
import { eq, sql } from 'drizzle-orm';
import { Context, Effect, Layer } from 'effect';

import { DbService, Todos, dieOnDatabaseFailure } from '#db';

export class TodoService extends Context.Service<TodoService>()('@repo/server/Todo/TodoService', {
  make: Effect.gen(function* () {
    const db = yield* DbService;

    const list = db.query.Todos.findMany({ orderBy: { createdAt: 'desc' } }).pipe(
      dieOnDatabaseFailure('TodoService.list'),
      Effect.withSpan('TodoService.list'),
    );

    const create = Effect.fn('TodoService.create')(function* (title: string) {
      const [created] = yield* db.insert(Todos).values({ title }).returning();
      if (created === undefined) {
        return yield* Effect.die(new Error('TodoService.create returned no row.'));
      }
      return created;
    }, dieOnDatabaseFailure('TodoService.create'));

    const toggle = Effect.fn('TodoService.toggle')(function* (todoId: TodoId) {
      const [updated] = yield* db
        .update(Todos)
        .set({ completed: sql`NOT ${Todos.completed}` })
        .where(eq(Todos.id, todoId))
        .returning();
      if (updated === undefined) {
        return yield* new TodoNotFound({ todoId });
      }
      return updated;
    }, dieOnDatabaseFailure('TodoService.toggle'));

    const remove = Effect.fn('TodoService.remove')(function* (todoId: TodoId) {
      const deleted = yield* db
        .delete(Todos)
        .where(eq(Todos.id, todoId))
        .returning({ id: Todos.id });
      if (deleted.length === 0) {
        return yield* new TodoNotFound({ todoId });
      }
    }, dieOnDatabaseFailure('TodoService.remove'));

    return { list, create, toggle, remove };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
  static readonly layerTest = Layer.mock(this);
}
