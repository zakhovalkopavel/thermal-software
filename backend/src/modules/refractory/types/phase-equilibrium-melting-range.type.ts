import type { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';

/** Solidus / liquidus interval of a matrix and how it was obtained. */
export type PhaseEquilibriumMeltingRange = {
  /** Solidus [°C] */
  solidus_C: number;

  /** Liquidus [°C] */
  liquidus_C: number;

  /** Composition of the first liquid [wt%]; empty when unknown */
  eutecticComposition: Record<string, number>;

  /** Method that produced the interval */
  method: PhaseEquilibriumMethod.EUTECTIC_ANCHORED | PhaseEquilibriumMethod.TM_ESTIMATE;

  /** Confidence of the interval */
  confidence: ConfidenceLevel.HIGH | ConfidenceLevel.MEDIUM | ConfidenceLevel.LOW;
};
