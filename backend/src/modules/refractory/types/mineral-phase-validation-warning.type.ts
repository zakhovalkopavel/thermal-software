/** Single mineral-phase validation warning. */
export type MineralPhaseValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;

  /** Severity of warning */
  severity: 'info' | 'warning' | 'caution';
};
