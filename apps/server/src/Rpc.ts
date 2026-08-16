import { AppRpcs } from '@repo/contracts';
import { Layer } from 'effect';
import { RpcServer } from 'effect/unstable/rpc';

import { DbService } from './lib/db/index.ts';
import { TodoHandlersLayer } from './modules/todo/Handlers.ts';
import { TodoRepository } from './modules/todo/TodoRepository.ts';
import { TodoService } from './modules/todo/TodoService.ts';

export const RpcLayer = RpcServer.layer(AppRpcs).pipe(
  Layer.provide(TodoHandlersLayer),
  Layer.provide(TodoService.layer),
  Layer.provide(TodoRepository.layer.pipe(Layer.provide(DbService.layer))),
);
