import { TodoId } from '@repo/contracts';
import { DateTime } from 'effect';

const OPTIMISTIC_ID_PREFIX = 'optimistic:';

let seq = 0;

/**
 * A client-only id for an optimistic row that has not been persisted yet.
 * Never send this to the server — it is replaced by the real id on refresh.
 */
export const optimisticId = (): TodoId =>
  TodoId.make(
    `${OPTIMISTIC_ID_PREFIX}${DateTime.toEpochMillis(DateTime.nowUnsafe()).toString(36)}-${(seq++).toString(
      36,
    )}`,
  );

export const isOptimisticId = (id: string): boolean => id.startsWith(OPTIMISTIC_ID_PREFIX);
