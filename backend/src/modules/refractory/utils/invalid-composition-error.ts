/**
 * Thrown when a composition cannot be normalised (non-numeric, negative or
 * all-zero input). Callers map it to a client error.
 */
export class InvalidCompositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCompositionError';
  }
}
