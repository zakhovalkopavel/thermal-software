/** Single packing validation warning. */
export type PackingValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
};
