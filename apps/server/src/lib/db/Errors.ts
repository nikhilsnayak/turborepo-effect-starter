import { EffectDrizzleQueryError } from 'drizzle-orm/effect-core';
import { Effect, Metric, Schema } from 'effect';
import { SqlError } from 'effect/sql';

type DatabaseFailure = EffectDrizzleQueryError | SqlError.SqlError;

const isEffectDrizzleQueryError = Schema.is(EffectDrizzleQueryError);
const isDatabaseFailure = <E>(error: E): error is Extract<E, DatabaseFailure> =>
  isEffectDrizzleQueryError(error) || SqlError.isSqlError(error);
const databaseFailures = Metric.counter('app_database_failures_total', {
  description: 'Database operation failures.',
  incremental: true,
});

export const dieOnDatabaseFailure = (operation: string) =>
  function dieOnFailure<A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ): Effect.Effect<A, Exclude<E, Extract<E, DatabaseFailure>>, R> {
    return effect.pipe(
      Effect.catchIf(
        isDatabaseFailure,
        (error) => {
          const cause = SqlError.isSqlError(error) ? error : error.cause;
          const reason = SqlError.isSqlError(cause) ? cause.reason._tag : error._tag;
          return Metric.update(databaseFailures.pipe(Metric.withAttributes({ operation })), 1).pipe(
            Effect.andThen(Effect.die(new Error(`Database failure in ${operation}: ${reason}.`))),
          );
        },
        Effect.fail,
      ),
    );
  };
