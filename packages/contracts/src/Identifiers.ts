import { Schema } from 'effect';

const TrimmedNonEmptyString = Schema.Trimmed.check(Schema.isNonEmpty());

export const TodoId = TrimmedNonEmptyString.pipe(Schema.brand('TodoId'));
export type TodoId = typeof TodoId.Type;
