import { InternalServerError } from '@repo/contracts/InternalServerError';
import { Cause, Option, Predicate, Schema } from 'effect';

export const withReference = (message: string, reference: string): string =>
  `${message} Reference ${reference}.`;

const isInternalServerError = Schema.is(InternalServerError);

export const failureMessage = (
  cause: Cause.Cause<unknown>,
  messages: Readonly<Record<string, string>>,
  fallback: string = 'Something went wrong. Please try again.',
): string => {
  const message = Cause.findErrorOption(cause).pipe(
    Option.flatMap((error) => {
      if (!Predicate.isObject(error) || !('_tag' in error) || !Predicate.isString(error._tag)) {
        return Option.none();
      }
      return Option.fromNullishOr(messages[error._tag]);
    }),
  );

  const baseMessage = Option.getOrElse(message, () => fallback);
  return Cause.findErrorOption(cause).pipe(
    Option.filter(isInternalServerError),
    Option.map(({ errorId }) => withReference(baseMessage, errorId)),
    Option.getOrElse(() => baseMessage),
  );
};
