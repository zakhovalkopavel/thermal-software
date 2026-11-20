/** Single shrinkage validation error. */
export type ShrinkageValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_MASS_FRACTION_SUM'
    | 'INVALID_WATER_CEMENT_RATIO'
    | 'INVALID_CEMENT_CONTENT'
    | 'MISMATCHED_ARRAY_LENGTH'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_DENSITY'
    | 'INVALID_CEMENT_TYPE'
    | 'OTHER';
};
