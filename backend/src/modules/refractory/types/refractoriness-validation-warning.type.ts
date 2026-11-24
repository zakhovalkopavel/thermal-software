/** Single refractoriness validation warning. */
export type RefractorinessValidationWarning = {
  /** Warning field */
  field: string;

  /** Warning message */
  message: string;

  /** Suggested corrective action */
  suggestion?: string;
};
