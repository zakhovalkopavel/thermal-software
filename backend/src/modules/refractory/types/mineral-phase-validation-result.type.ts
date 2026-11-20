import type { MineralPhaseValidationError } from './mineral-phase-validation-error.type';
import type { MineralPhaseValidationWarning } from './mineral-phase-validation-warning.type';

/** Validation result for mineral phase input. */
export type MineralPhaseValidationResult = {
  /** Whether input is valid */
  isValid: boolean;

  /** Validation errors if any */
  errors: MineralPhaseValidationError[];

  /** Validation warnings if any */
  warnings: MineralPhaseValidationWarning[];
};
