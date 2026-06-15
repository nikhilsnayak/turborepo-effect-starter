import { Schema } from 'effect';

export class InternalServerError extends Schema.TaggedErrorClass<InternalServerError>()(
  '@workspace/contracts/InternalServerError',
  {
    message: Schema.String,
  },
) {}
