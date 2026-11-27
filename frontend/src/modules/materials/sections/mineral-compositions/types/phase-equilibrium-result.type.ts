import type { PhaseEquilibriumBlock } from './phase-equilibrium-block.type';
import type { PhaseEquilibriumCrystal } from './phase-equilibrium-crystal.type';
import type { PhaseEquilibriumFractionResult } from './phase-equilibrium-fraction-result.type';
import type { PhaseEquilibriumMatrix } from './phase-equilibrium-matrix.type';
import type { PhaseEquilibriumMetadata } from './phase-equilibrium-metadata.type';

/** Mirrors the essentials of the backend `PhaseEquilibriumResponse`. */
export type PhaseEquilibriumResult = {
  atTemperature: {
    liquid: PhaseEquilibriumBlock;
    glass: PhaseEquilibriumBlock;
    crystals: PhaseEquilibriumCrystal[];
  };
  /** Quenched matrix liquid + unreacted glass (glass points on parts). */
  afterCooling: {
    glass: PhaseEquilibriumBlock;
    crystals: PhaseEquilibriumCrystal[];
  };
  fractions: PhaseEquilibriumFractionResult[];
  matrix: PhaseEquilibriumMatrix;
  metadata: PhaseEquilibriumMetadata;
  warnings: string[];
};
