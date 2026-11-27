import type { ConfidenceLevel } from '../enums/confidence-level.enum';
import type { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';

/** Result of probing Abdul / Mao staged liquid data for a CAS matrix. */
export type CalphadStagingProbe = {
  method?: PhaseEquilibriumMethod;
  confidence?: ConfidenceLevel.HIGH | ConfidenceLevel.MEDIUM | ConfidenceLevel.LOW;
  status: 'estimated' | 'assessed';
};
