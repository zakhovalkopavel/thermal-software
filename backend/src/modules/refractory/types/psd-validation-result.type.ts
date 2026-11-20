import type { PSDValidationError } from './psd-validation-error.type';
import type { PSDValidationWarning } from './psd-validation-warning.type';

/** Validation result for PSD input. */
export type PSDValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: PSDValidationError[];

  /** Validation warnings if any */
  warnings: PSDValidationWarning[];
};
