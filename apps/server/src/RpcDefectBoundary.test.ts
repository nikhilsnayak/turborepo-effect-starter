import { BunCrypto } from '@effect/platform-bun';
import { assert, it } from '@effect/vitest';
import { RpcDefectBoundary as RpcDefectBoundaryService } from '@repo/contracts/AppRpcs';
import { InternalServerError } from '@repo/contracts/InternalServerError';
import { TodoId, TodoNotFound, TodoRpcs } from '@repo/contracts/modules/Todo';
import { Cause, Effect, Exit, Layer, Logger, Option, References, Schema } from 'effect';
import { Headers, HttpRouter } from 'effect/http';
import { Rpc, RpcGroup, RpcSerialization, RpcServer } from 'effect/rpc';
import { RequestId } from 'effect/rpc/RpcMessage';

import { RpcDefectBoundaryLayer } from './RpcDefectBoundary.ts';

const BoundaryLayer = RpcDefectBoundaryLayer.pipe(Layer.provide(BunCrypto.layer));

const listRpc = TodoRpcs.requests.get('Todo.List')!;

it.effect('returns a public error and logs the original defect cause', () =>
  Effect.gen(function* () {
    const logs: Array<{
      readonly message: unknown;
      readonly cause: Cause.Cause<unknown>;
      readonly annotations: Record<string, unknown>;
    }> = [];
    const logger = Logger.make<unknown, void>((options) => {
      logs.push({
        message: options.message,
        cause: options.cause,
        annotations: { ...options.fiber.getRef(References.CurrentLogAnnotations) },
      });
    });
    const defect = new Error('sensitive row value');

    const exit = yield* Effect.gen(function* () {
      const boundary = yield* RpcDefectBoundaryService;
      return yield* boundary(
        Effect.logInfo('Handler started.').pipe(Effect.andThen(Effect.die(defect))),
        {
          client: new Rpc.ServerClient(1),
          requestId: RequestId('request-1'),
          rpc: listRpc,
          payload: undefined,
          headers: Headers.empty,
        },
      );
    }).pipe(
      Effect.scoped,
      Effect.provide(Layer.merge(BoundaryLayer, Logger.layer([logger]))),
      Effect.exit,
    );

    assert(Exit.isFailure(exit));
    const error = Cause.findErrorOption(exit.cause);
    assert(Option.isSome(error));
    if (Option.isSome(error) && Schema.is(InternalServerError)(error.value)) {
      assert.strictEqual(error.value._tag, 'InternalServerError');
      assert.match(error.value.errorId, /^[0-9a-f-]{36}$/i);
      assert.strictEqual(logs[1]?.annotations['errorId'], error.value.errorId);
    } else {
      assert.fail('Expected InternalServerError.');
    }

    assert.strictEqual(logs.length, 2);
    assert.deepStrictEqual(logs[0]?.message, ['Handler started.']);
    assert.strictEqual(logs[0]?.annotations['rpc'], 'Todo.List');
    assert.strictEqual(logs[0]?.annotations['requestId'], 'request-1');
    assert.deepStrictEqual(logs[1]?.message, ['Unhandled RPC defect.']);
    assert.strictEqual(logs[1]?.annotations['rpc'], 'Todo.List');
    assert.strictEqual(logs[1]?.annotations['requestId'], 'request-1');
    assert.strictEqual(Cause.squash(logs[1]!.cause), defect);
  }),
);

it.effect('exposes the middleware error for an RPC without a declared error', () =>
  Effect.gen(function* () {
    const defect = new Error('private database detail');
    const TestRpcs = RpcGroup.make(Rpc.make('Test.Defect', { success: Schema.Void })).middleware(
      RpcDefectBoundaryService,
    );
    const layer = RpcServer.layer(TestRpcs).pipe(
      Layer.provide(TestRpcs.toLayer({ 'Test.Defect': () => Effect.die(defect) })),
      Layer.provide(BoundaryLayer),
      Layer.provide(RpcServer.layerProtocolHttp({ path: '/rpc' })),
      Layer.provide(RpcSerialization.layerNdjson),
      Layer.provide(Logger.layer([])),
    );
    const app = HttpRouter.toWebHandler(layer, { disableLogger: true });
    yield* Effect.addFinalizer(() => Effect.promise(() => app.dispose()));

    const response = yield* Effect.promise(() =>
      app.handler(
        new Request('https://api.example.test/rpc', {
          method: 'POST',
          headers: { 'content-type': 'application/ndjson' },
          body: '{"_tag":"Request","id":"1","tag":"Test.Defect","payload":null,"headers":[]}\n',
        }),
      ),
    );
    const body = yield* Effect.promise(() => response.text());
    assert.include(body, 'InternalServerError');
    assert.notInclude(body, defect.message);
  }),
);

it.effect('preserves an expected RPC error', () =>
  Effect.gen(function* () {
    const todoId = TodoId.make('missing-todo');
    const TestRpcs = RpcGroup.make(
      Rpc.make('Test.Expected', { success: Schema.Void, error: TodoNotFound }),
    ).middleware(RpcDefectBoundaryService);
    const layer = RpcServer.layer(TestRpcs).pipe(
      Layer.provide(
        TestRpcs.toLayer({
          'Test.Expected': () => Effect.fail(new TodoNotFound({ todoId })),
        }),
      ),
      Layer.provide(BoundaryLayer),
      Layer.provide(RpcServer.layerProtocolHttp({ path: '/rpc' })),
      Layer.provide(RpcSerialization.layerNdjson),
      Layer.provide(Logger.layer([])),
    );
    const app = HttpRouter.toWebHandler(layer, { disableLogger: true });
    yield* Effect.addFinalizer(() => Effect.promise(() => app.dispose()));

    const response = yield* Effect.promise(() =>
      app.handler(
        new Request('https://api.example.test/rpc', {
          method: 'POST',
          headers: { 'content-type': 'application/ndjson' },
          body: '{"_tag":"Request","id":"1","tag":"Test.Expected","payload":null,"headers":[]}\n',
        }),
      ),
    );
    const body = yield* Effect.promise(() => response.text());
    assert.include(body, 'TodoNotFound');
    assert.notInclude(body, 'InternalServerError');
  }),
);
