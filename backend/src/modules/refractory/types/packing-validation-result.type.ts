import type { PackingValidationError } from './packing-validation-error.type';
import type { PackingValidationWarning } from './packing-validation-warning.type';

/** Validation result for packing calculation input. */
export type PackingValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: PackingValidationError[];

  /** Validation warnings if any */
  warnings: PackingValidationWarning[];
};
