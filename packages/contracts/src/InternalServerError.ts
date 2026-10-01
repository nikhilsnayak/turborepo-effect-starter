import { Schema } from 'effect';

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  'InternalServerError',
  { errorId: Schema.String.check(Schema.isUUID()) },
) {}
