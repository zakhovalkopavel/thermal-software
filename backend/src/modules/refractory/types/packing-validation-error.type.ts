/** Single packing validation error. */
export type PackingValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_MASS_FRACTION_SUM'
    | 'INVALID_DENSITY'
    | 'INVALID_DIAMETER'
    | 'MISMATCHED_ARRAY_LENGTH'
    | 'INVALID_PRESSURE'
    | 'INVALID_CALIBRATION'
    | 'OTHER';
};
