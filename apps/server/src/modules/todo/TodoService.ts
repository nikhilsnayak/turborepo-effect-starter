import { InternalServerError, type TodoId } from '@repo/contracts';
import { TodoNotFound } from '@repo/contracts/modules/todo';
import { Context, Effect, Layer, Option } from 'effect';

import { mapDatabaseFailure } from '@/lib/db';

import { TodoRepository } from './TodoRepository.ts';

export class TodoService extends Context.Service<TodoService>()(
  '@repo/server/modules/todo/TodoService',
  {
    make: Effect.gen(function* () {
      const todoRepository = yield* TodoRepository;

      const list = Effect.fn('TodoService.list')(function* () {
        return yield* todoRepository.findAll();
      }, mapDatabaseFailure('Failed to load todos.'));

      const create = Effect.fn('TodoService.create')(function* (title: string) {
        const created = yield* todoRepository.create(title);
        if (Option.isNone(created)) {
          return yield* new InternalServerError({ message: 'Failed to create todo.' });
        }
        return created.value;
      }, mapDatabaseFailure('Failed to create todo.'));

      const toggle = Effect.fn('TodoService.toggle')(function* (todoId: TodoId) {
        const updated = yield* todoRepository.toggle(todoId);
        if (Option.isNone(updated)) {
          return yield* new TodoNotFound({ todoId });
        }
        return updated.value;
      }, mapDatabaseFailure('Failed to update todo.'));

      const remove = Effect.fn('TodoService.remove')(function* (todoId: TodoId) {
        const deleted = yield* todoRepository.remove(todoId);
        if (!deleted) {
          return yield* new TodoNotFound({ todoId });
        }
      }, mapDatabaseFailure('Failed to delete todo.'));

      return { list, create, toggle, remove };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
