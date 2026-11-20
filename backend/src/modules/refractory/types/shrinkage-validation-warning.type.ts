/** Single shrinkage validation warning. */
export type ShrinkageValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
};
