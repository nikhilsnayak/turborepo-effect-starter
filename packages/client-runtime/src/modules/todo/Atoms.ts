import { DateTime } from 'effect';
import { AsyncResult, Atom } from 'effect/unstable/reactivity';

import { AppClient } from '../../AppClient.ts';
import { optimisticId } from '../../Optimistic.ts';

const todosQuery = AppClient.query('Todo.List', undefined);

export const todosAtom = todosQuery.pipe(Atom.optimistic);

export const createTodoAtom = todosAtom.pipe(
  Atom.optimisticFn({
    fn: AppClient.mutation('Todo.Create'),
    reducer: (current, update) => {
      const now = DateTime.formatIso(DateTime.nowUnsafe());
      return AsyncResult.map(current, (todos) => [
        {
          id: optimisticId(),
          title: update.payload.title,
          completed: false,
          createdAt: now,
          updatedAt: now,
        },
        ...todos,
      ]);
    },
  }),
);

export const toggleTodoAtom = todosAtom.pipe(
  Atom.optimisticFn({
    fn: AppClient.mutation('Todo.Toggle'),
    reducer: (current, update) =>
      AsyncResult.map(current, (todos) =>
        todos.map((todo) =>
          todo.id === update.payload.todoId ? { ...todo, completed: !todo.completed } : todo,
        ),
      ),
  }),
);

export const deleteTodoAtom = todosAtom.pipe(
  Atom.optimisticFn({
    fn: AppClient.mutation('Todo.Delete'),
    reducer: (current, update) =>
      AsyncResult.map(current, (todos) =>
        todos.filter((todo) => todo.id !== update.payload.todoId),
      ),
  }),
);
