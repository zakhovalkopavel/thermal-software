/** Single blend-optimization validation error. */
export type ValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code: 'INVALID_RANGE' | 'INVALID_TYPE' | 'MISSING_REQUIRED' | 'INVALID_SCENARIO' | 'OTHER';
};
