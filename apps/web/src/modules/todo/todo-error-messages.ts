import { failureMessage } from '@repo/client-runtime/Failure';
import { Cause } from 'effect';

type TodoAction = 'create' | 'toggle' | 'delete';

const actionFailureMessages = {
  create: "Couldn't create the todo. Check your connection and try again.",
  toggle: "Couldn't update the todo. Check your connection and try again.",
  delete: "Couldn't delete the todo. Check your connection and try again.",
} satisfies Record<TodoAction, string>;

export const messageForTodoActionCause = (
  action: TodoAction,
  cause: Cause.Cause<unknown>,
): string =>
  failureMessage(
    cause,
    { TodoNotFound: 'That todo no longer exists — your list may be out of date.' },
    actionFailureMessages[action],
  );
