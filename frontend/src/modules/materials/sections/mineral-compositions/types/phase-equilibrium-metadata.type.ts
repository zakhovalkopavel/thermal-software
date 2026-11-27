import type { AlgorithmMode } from './algorithm-mode.type';
import type { PhaseEquilibriumComparison } from './phase-equilibrium-comparison.type';

export type PhaseEquilibriumMetadata = {
  engine?: AlgorithmMode;
  /** e.g. `calphad_full`, `legacy_eutectic` */
  method?: string;
  /** `HIGH` | `MEDIUM` | `LOW` | `VERY_LOW` */
  confidence?: string;
  /** °C */
  temperature: number;
  holdTime_hours: number;
  /** kg */
  totalMass: number;
  /** Reacted matrix, % of the fired body */
  reactedPercent: number;
  /** Present for `algorithmMode = compare` */
  comparison?: PhaseEquilibriumComparison;
  /** ISO timestamp */
  calculatedAt: string;
};
