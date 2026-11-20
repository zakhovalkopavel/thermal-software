import type { GlassViscosityValidationError } from './glass-viscosity-validation-error.type';
import type { GlassViscosityValidationWarning } from './glass-viscosity-validation-warning.type';

/** Validation result for glass viscosity input. */
export type GlassViscosityValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: GlassViscosityValidationError[];

  /** Validation warnings if any */
  warnings: GlassViscosityValidationWarning[];
};
