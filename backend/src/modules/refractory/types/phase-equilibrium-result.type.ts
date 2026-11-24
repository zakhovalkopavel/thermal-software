import type { PhaseData } from './phase-data.type';
import type { PhaseEquilibriumMetadata } from './phase-equilibrium-metadata.type';
import type { SolidPhaseData } from './solid-phase-data.type';

/** Complete phase equilibrium calculation result. */
export type PhaseEquilibriumResult = {
  /** Liquid phase data */
  liquid: PhaseData;

  /** Solid phase data with mineral phases */
  solid: SolidPhaseData;

  /** Calculation metadata */
  metadata: PhaseEquilibriumMetadata;

  /** Calculation warnings/notes */
  warnings: string[];
};
