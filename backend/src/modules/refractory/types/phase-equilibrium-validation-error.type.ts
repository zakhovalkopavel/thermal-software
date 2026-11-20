/** Single phase-equilibrium validation error. */
export type PhaseEquilibriumValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_COMPONENT'
    | 'INVALID_TOTAL_MASS'
    | 'EMPTY_COMPOSITION'
    | 'OTHER';
};
