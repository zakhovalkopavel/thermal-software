export type PhaseEquilibriumFractionInput = {
  materialId: string;
  /** Median grain diameter, mm */
  d50_mm: number;
  /** 0–1 relative mass; the backend rescales to Σ = 1 */
  massFraction: number;
};
