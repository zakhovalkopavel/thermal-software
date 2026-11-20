import type { ThermalValidationError } from './thermal-validation-error.type';
import type { ThermalValidationWarning } from './thermal-validation-warning.type';

/** Validation result for thermal input. */
export type ThermalValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: ThermalValidationError[];

  /** Validation warnings if any */
  warnings: ThermalValidationWarning[];
};
