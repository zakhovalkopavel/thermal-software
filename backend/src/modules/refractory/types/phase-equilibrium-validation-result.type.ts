import type { PhaseEquilibriumValidationError } from './phase-equilibrium-validation-error.type';
import type { PhaseEquilibriumValidationWarning } from './phase-equilibrium-validation-warning.type';

/** Validation result for phase equilibrium input. */
export type PhaseEquilibriumValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: PhaseEquilibriumValidationError[];

  /** Validation warnings if any */
  warnings: PhaseEquilibriumValidationWarning[];
};
