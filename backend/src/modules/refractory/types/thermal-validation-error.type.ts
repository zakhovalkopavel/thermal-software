/** Single thermal validation error. */
export type ThermalValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_POROSITY'
    | 'INVALID_COMPONENT'
    | 'OUT_OF_RANGE'
    | 'OTHER';
};
