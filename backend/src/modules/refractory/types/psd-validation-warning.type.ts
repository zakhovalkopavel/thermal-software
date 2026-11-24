/** Single PSD validation warning. */
export type PSDValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
};
