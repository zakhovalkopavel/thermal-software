/** Single mineral-phase validation error. */
export type MineralPhaseValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'EMPTY_COMPOSITION'
    | 'OUT_OF_RANGE'
    | 'OTHER';
};
