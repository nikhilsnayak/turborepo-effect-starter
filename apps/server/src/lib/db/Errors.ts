import { InternalServerError } from '@repo/contracts';
import { EffectDrizzleQueryError } from 'drizzle-orm/effect-core';
import { Effect, Schema } from 'effect';

type DatabaseFailure = EffectDrizzleQueryError;

const isDatabaseFailure = <E>(error: E): error is Extract<E, DatabaseFailure> =>
  Schema.is(EffectDrizzleQueryError)(error);

export const mapDatabaseFailure = (message: string) =>
  function map<A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ): Effect.Effect<A, Exclude<E, Extract<E, DatabaseFailure>> | InternalServerError, R> {
    return effect.pipe(
      Effect.catchIf(
        isDatabaseFailure,
        (error) =>
          Effect.logError(message, error).pipe(
            Effect.andThen(Effect.fail(new InternalServerError({ message }))),
          ),
        Effect.fail,
      ),
    );
  };
