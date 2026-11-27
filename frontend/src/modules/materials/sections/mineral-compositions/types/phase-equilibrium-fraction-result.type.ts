export type PhaseEquilibriumFractionResult = {
  materialId: string;
  d50_mm: number;
  massFraction: number;
  /** Reaction penetration depth δ, mm */
  penetrationDepth_mm: number;
  /** % of the fraction's grain volume */
  reactedPercent: number;
};
