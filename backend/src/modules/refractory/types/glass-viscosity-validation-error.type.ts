/** Single glass-viscosity validation error. */
export type GlassViscosityValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'INVALID_GLASS_TYPE'
    | 'OUT_OF_RANGE'
    | 'OTHER';
};
