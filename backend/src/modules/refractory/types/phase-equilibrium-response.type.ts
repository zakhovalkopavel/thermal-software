import type { PhaseEquilibriumFractionResult } from './phase-equilibrium-fraction-result.type';
import type { PhaseEquilibriumMatrixResult } from './phase-equilibrium-matrix-result.type';
import type { PhaseEquilibriumResponseBlock } from './phase-equilibrium-response-block.type';
import type { PhaseEquilibriumResponseCrystal } from './phase-equilibrium-response-crystal.type';
import type { PhaseEquilibriumRunMetadata } from './phase-equilibrium-run-metadata.type';
import type { PhaseEquilibriumUnreactedPhase } from './phase-equilibrium-unreacted-phase.type';

/** Result of `POST /refractory/phase-equilibrium` (docs/api/refractory-api-phase-equilibrium.md). */
export type PhaseEquilibriumResponse = {
  atTemperature: {
    liquid: PhaseEquilibriumResponseBlock;
    glass: PhaseEquilibriumResponseBlock;
    crystals: PhaseEquilibriumResponseCrystal[];
  };
  afterCooling: {
    glass: PhaseEquilibriumResponseBlock;
    crystals: PhaseEquilibriumResponseCrystal[];
  };
  unreactedOriginalPhases: PhaseEquilibriumUnreactedPhase[];
  fractions: PhaseEquilibriumFractionResult[];
  matrix: PhaseEquilibriumMatrixResult;
  metadata: PhaseEquilibriumRunMetadata;
  warnings: string[];
};
