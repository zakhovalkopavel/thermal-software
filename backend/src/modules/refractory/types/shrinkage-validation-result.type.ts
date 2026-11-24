import type { ShrinkageValidationError } from './shrinkage-validation-error.type';
import type { ShrinkageValidationWarning } from './shrinkage-validation-warning.type';

/** Validation result for shrinkage input. */
export type ShrinkageValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ShrinkageValidationError[];

  /** Validation warnings if any */
  warnings: ShrinkageValidationWarning[];
};
