import type { AlgorithmMode } from './algorithm-mode.type';
import type { LegacyVariant } from './legacy-variant.type';
import type { PhaseEquilibriumFractionInput } from './phase-equilibrium-fraction-input.type';

export type PhaseEquilibriumInput = {
  fractions: PhaseEquilibriumFractionInput[];
  /** °C, 500–2000 */
  temperature: number;
  /** h; the backend default is 2 */
  holdTime_hours?: number;
  /** kg */
  totalMass?: number;
  /** Backend default: `calphad` */
  algorithmMode?: AlgorithmMode;
  /** Only meaningful for `legacy` / `compare` */
  legacyVariant?: LegacyVariant;
};
