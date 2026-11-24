import type { ValidationError } from './validation-error.type';
import type { ValidationWarning } from './validation-warning.type';

/** Validation result for blend optimization input. */
export type ValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ValidationError[];

  /** Validation warnings if any */
  warnings: ValidationWarning[];
};
