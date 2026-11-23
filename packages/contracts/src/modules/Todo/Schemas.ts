import { Schema } from 'effect';

const TrimmedNonEmptyString = Schema.Trimmed.check(Schema.isNonEmpty());

export const TodoId = TrimmedNonEmptyString.pipe(Schema.brand('TodoId'));
export type TodoId = typeof TodoId.Type;

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
});
export type Todo = typeof Todo.Type;

export const TodoCreateInput = Schema.Struct({
  title: Schema.Trimmed.check(Schema.isNonEmpty()),
});
export type TodoCreateInput = typeof TodoCreateInput.Type;

export const TodoMutationInput = Schema.Struct({
  todoId: TodoId,
});
export type TodoMutationInput = typeof TodoMutationInput.Type;

export class TodoNotFound extends Schema.TaggedError<
  TodoNotFound,
  { readonly brand: unique symbol }
>()('TodoNotFound', {
  todoId: TodoId,
}) {}
