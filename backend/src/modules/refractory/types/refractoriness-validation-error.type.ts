/** Single refractoriness validation error. */
export type RefractorinessValidationError = {
  /** Error field */
  field: string;

  /** Error message */
  message: string;

  /** Error code */
  code:
    | 'INVALID_COMPOSITION_SUM'
    | 'INVALID_COMPONENT'
    | 'INVALID_DUTY_CLASS'
    | 'INVALID_TEST_LOAD'
    | 'INVALID_STANDARD'
    | 'EMPTY_COMPOSITION'
    | 'OTHER';
};
