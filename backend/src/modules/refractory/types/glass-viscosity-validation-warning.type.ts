/** Single glass-viscosity validation warning. */
export type GlassViscosityValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;

  /** Impact on calculation */
  impact: 'low' | 'medium' | 'high';
};
