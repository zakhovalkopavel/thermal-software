import type { RefractorinessValidationError } from './refractoriness-validation-error.type';
import type { RefractorinessValidationWarning } from './refractoriness-validation-warning.type';

/** Validation result for refractoriness input. */
export type RefractorinessValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: RefractorinessValidationError[];

  /** Validation warnings if any */
  warnings: RefractorinessValidationWarning[];
};
