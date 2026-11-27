/** Grain-reaction result of one size fraction. */
export type PhaseEquilibriumFractionResult = {
  materialId: string;

  /** Median grain diameter [mm] */
  d50_mm: number;

  /** Raw mass fraction, Σ = 1 [-] */
  massFraction: number;

  /** Reaction penetration depth δ [mm] */
  penetrationDepth_mm: number;

  /** Reacted share of the fraction's grains [% of volume] */
  reactedPercent: number;
};
