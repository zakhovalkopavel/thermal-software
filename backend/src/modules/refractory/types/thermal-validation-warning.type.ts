/** Single thermal validation warning. */
export type ThermalValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;

  /** Impact on calculation */
  impact: 'low' | 'medium' | 'high';
};
