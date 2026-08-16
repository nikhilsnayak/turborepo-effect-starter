import { assert, describe, it } from '@effect/vitest';
import { TodoId } from '@repo/contracts';
import { Effect, Layer, Option } from 'effect';

import { TodoRepository } from './TodoRepository.ts';
import { TodoService } from './TodoService.ts';

const todoId = TodoId.make('todo-1');

const withRepository = (repository: Layer.Layer<TodoRepository>) =>
  Effect.provide(TodoService.layer.pipe(Layer.provide(repository)));

describe('TodoService', () => {
  it.effect('fails with TodoNotFound when toggling a missing todo', () =>
    Effect.gen(function* () {
      const service = yield* TodoService;
      const error = yield* service.toggle(todoId).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'TodoNotFound');
      if (error._tag === 'TodoNotFound') {
        assert.strictEqual(error.todoId, todoId);
      }
    }).pipe(
      withRepository(TodoRepository.layerTest({ toggle: () => Effect.succeed(Option.none()) })),
    ),
  );
});
