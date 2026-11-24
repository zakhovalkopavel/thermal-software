/** Single phase-equilibrium validation warning. */
export type PhaseEquilibriumValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
};
