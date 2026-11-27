import type { AlgorithmMode } from '../enums/algorithm-mode.enum';
import type { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';
import type { PhaseEquilibriumComparison } from './phase-equilibrium-comparison.type';

/** Metadata of a phase-equilibrium run. */
export type PhaseEquilibriumRunMetadata = {
  /** Algorithm mode of the request */
  engine: AlgorithmMode;

  /** Method of the primary result */
  method: PhaseEquilibriumMethod;

  /** Confidence of the primary result */
  confidence: ConfidenceLevel;

  /** Firing temperature [°C] */
  temperature: number;

  /** Hold time [h] */
  holdTime_hours: number;

  /** Fired mass of the body [kg] */
  totalMass: number;

  /** Reacted matrix [% of the fired body] */
  reactedPercent: number;

  /** Calculation timestamp */
  calculatedAt: Date;

  /** Present for `algorithmMode = compare` */
  comparison?: PhaseEquilibriumComparison;
};
