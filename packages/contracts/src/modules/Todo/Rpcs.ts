import { Schema } from 'effect';
import { Rpc, RpcGroup } from 'effect/rpc';

import { Todo, TodoCreateInput, TodoMutationInput, TodoNotFound } from './Schemas.ts';

export const TodoRpcs = RpcGroup.make(
  Rpc.make('List', {
    payload: Schema.Void,
    success: Schema.Array(Todo),
  }),
  Rpc.make('Create', {
    payload: TodoCreateInput,
    success: Todo,
  }),
  Rpc.make('Toggle', {
    payload: TodoMutationInput,
    success: Todo,
    error: TodoNotFound,
  }),
  Rpc.make('Delete', {
    payload: TodoMutationInput,
    error: TodoNotFound,
  }),
).prefix('Todo.');
