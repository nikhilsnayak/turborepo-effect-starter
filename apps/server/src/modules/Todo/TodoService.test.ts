import { assert, describe, it } from '@effect/vitest';
import { TodoId } from '@repo/contracts/modules/Todo';
import { Effect, Layer } from 'effect';

import { PgliteDbLayer } from '../../lib/db/PgliteDb.ts';
import { TodoService } from './TodoService.ts';

const layer = TodoService.layer.pipe(Layer.provideMerge(PgliteDbLayer));

describe('TodoService', () => {
  it.effect('creates, lists, toggles, and removes todos through Drizzle', () =>
    Effect.gen(function* () {
      const service = yield* TodoService;
      const created = yield* service.create('Use PGlite in service tests');
      assert.strictEqual(created.title, 'Use PGlite in service tests');
      assert.isFalse(created.completed);

      const listed = yield* service.list;
      assert.deepStrictEqual(listed, [created]);

      const toggled = yield* service.toggle(created.id);
      assert.isTrue(toggled.completed);
      const listedAfterToggle = yield* service.list;
      assert.deepStrictEqual(listedAfterToggle, [toggled]);

      yield* service.remove(created.id);
      const listedAfterRemoval = yield* service.list;
      assert.deepStrictEqual(listedAfterRemoval, []);
    }).pipe(Effect.provide(layer)),
  );

  it.effect('fails with TodoNotFound when toggling or removing a missing todo', () =>
    Effect.gen(function* () {
      const service = yield* TodoService;
      const todoId = TodoId.make('missing-todo');
      const toggleError = yield* service.toggle(todoId).pipe(Effect.flip);
      const removeError = yield* service.remove(todoId).pipe(Effect.flip);

      assert.strictEqual(toggleError._tag, 'TodoNotFound');
      assert.strictEqual(removeError._tag, 'TodoNotFound');
    }).pipe(Effect.provide(layer)),
  );
});
