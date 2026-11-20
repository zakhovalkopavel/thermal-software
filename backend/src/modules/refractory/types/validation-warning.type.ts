/** Single blend-optimization validation warning. */
export type ValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested action */
  suggestion?: string;
};
