import { Schema } from 'effect';

export class InternalServerError extends Schema.TaggedError<
  InternalServerError,
  { readonly brand: unique symbol }
>()('InternalServerError', { errorId: Schema.String.check(Schema.isUUID()) }) {}
