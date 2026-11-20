/** Single PSD validation error. */
export type PSDValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_Q_VALUE'
    | 'INVALID_DIAMETER_RANGE'
    | 'INVALID_MASS_FRACTION'
    | 'NO_VARIABLE_FRACTIONS'
    | 'FIXED_FRACTIONS_TOO_HIGH'
    | 'DMIN_GREATER_THAN_DMAX'
    | 'OTHER';
};
