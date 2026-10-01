import { RpcDefectBoundary as RpcDefectBoundaryService } from '@repo/contracts/AppRpcs';
import { InternalServerError } from '@repo/contracts/InternalServerError';
import { Cause, Crypto, Effect, Layer, Metric } from 'effect';

const rpcDefects = Metric.counter('app_rpc_defects_total', {
  description: 'Unexpected RPC handler defects.',
  incremental: true,
});

export const RpcDefectBoundaryLayer = Layer.effect(
  RpcDefectBoundaryService,
  Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto;
    return RpcDefectBoundaryService.of((effect, { requestId, rpc }) =>
      effect.pipe(
        Effect.catchCauseIf(Cause.hasDies, (cause) =>
          Effect.gen(function* () {
            const errorId = yield* crypto.randomUUIDv7.pipe(Effect.orDie);
            yield* Metric.update(rpcDefects.pipe(Metric.withAttributes({ rpc: rpc._tag })), 1);
            yield* Effect.logError('Unhandled RPC defect.', cause).pipe(
              Effect.annotateLogs({ errorId }),
            );
            return yield* new InternalServerError({ errorId });
          }),
        ),
        Effect.annotateLogs({
          rpc: rpc._tag,
          requestId,
        }),
      ),
    );
  }),
);
