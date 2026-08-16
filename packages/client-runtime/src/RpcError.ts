import type { AppRpcs } from '@repo/contracts';
import { Cause, Match, Option } from 'effect';
import type { Rpc, RpcClientError, RpcGroup } from 'effect/unstable/rpc';

type AppError = Rpc.Error<RpcGroup.Rpcs<typeof AppRpcs>> | RpcClientError.RpcClientError;

const errorMessage = Match.typeTags<AppError, string>()({
  TodoNotFound: () => 'That todo no longer exists — your list may be out of date.',
  InternalServerError: () => 'Something went wrong on our end. Please try again.',
  RpcClientError: () => "Couldn't reach the server. Check your connection and retry.",
});

export function messageForCause<E extends AppError>(cause: Cause.Cause<E>): string {
  return Option.match(Cause.findErrorOption(cause), {
    onNone: () => 'Something went wrong. Please try again.',
    onSome: errorMessage,
  });
}
