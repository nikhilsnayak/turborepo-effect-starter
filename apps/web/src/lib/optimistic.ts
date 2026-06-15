const OPTIMISTIC_ID_PREFIX = 'optimistic:';

/**
 * A client-only id for an optimistic row that has not been persisted yet.
 * Never send this to the server — it is replaced by the real id on refresh.
 */
export const optimisticId = (): string => `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`;

export const isOptimisticId = (id: string): boolean => id.startsWith(OPTIMISTIC_ID_PREFIX);
