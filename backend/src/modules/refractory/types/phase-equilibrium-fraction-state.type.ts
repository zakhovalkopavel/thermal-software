import type { MaterialEntryDto } from '../dto/material-catalog/material-entry.dto';

/** One size fraction of the mix after material lookup and grain-reaction model. */
export type PhaseEquilibriumFractionState = {
  /** Library material of the fraction */
  material: MaterialEntryDto;

  /** Median grain diameter [mm] */
  d50_mm: number;

  /** Raw mass fraction, rescaled so that Σ = 1 [-] */
  massFraction: number;

  /** Fired mass fraction of the body, Σ = 1 [-] */
  firedFraction: number;

  /** Reaction penetration depth δ [mm] */
  penetrationDepth_mm: number;

  /** Reacted volume fraction X of the grains [-] */
  reactedFraction: number;

  /** Fired phase composition of the material [wt%], Σ = 100 */
  firedPhases_wt: Record<string, number>;
};
