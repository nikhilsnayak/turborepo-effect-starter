import { InternalServerError, TodoNotFound } from '@workspace/contracts';
import { Context, Effect, Layer, Option } from 'effect';

import { TodoRepository } from './TodoRepository';

export class TodoService extends Context.Service<TodoService>()('@workspace/server/TodoService', {
  make: Effect.gen(function* () {
    const todoRepository = yield* TodoRepository;

    return {
      list: () =>
        todoRepository
          .findAll()
          .pipe(
            Effect.catchTag('EffectDrizzleQueryError', () =>
              Effect.fail(new InternalServerError({ message: 'Failed to load todos.' })),
            ),
          ),

      create: (title: string) =>
        Effect.gen(function* () {
          const created = yield* todoRepository.create(title);
          if (Option.isNone(created)) {
            return yield* new InternalServerError({ message: 'Failed to create todo.' });
          }
          return created.value;
        }).pipe(
          Effect.catchTag('EffectDrizzleQueryError', () =>
            Effect.fail(new InternalServerError({ message: 'Failed to create todo.' })),
          ),
        ),

      toggle: (todoId: string) =>
        Effect.gen(function* () {
          const existing = yield* todoRepository.findById(todoId);
          if (Option.isNone(existing)) {
            return yield* new TodoNotFound({ todoId });
          }

          const updated = yield* todoRepository.setCompleted(todoId, !existing.value.completed);
          if (Option.isNone(updated)) {
            return yield* new TodoNotFound({ todoId });
          }
          return updated.value;
        }).pipe(
          Effect.catchTag('EffectDrizzleQueryError', () =>
            Effect.fail(new InternalServerError({ message: 'Failed to update todo.' })),
          ),
        ),

      remove: (todoId: string) =>
        Effect.gen(function* () {
          const deleted = yield* todoRepository.remove(todoId);
          if (!deleted) {
            return yield* new TodoNotFound({ todoId });
          }
        }).pipe(
          Effect.catchTag('EffectDrizzleQueryError', () =>
            Effect.fail(new InternalServerError({ message: 'Failed to delete todo.' })),
          ),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(TodoRepository.layer));
}
