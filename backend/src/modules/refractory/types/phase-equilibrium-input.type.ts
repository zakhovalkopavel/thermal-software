/** Complete phase equilibrium calculation request. */
export type PhaseEquilibriumInput = {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature in °C */
  temperature: number;

  /** Total mass for calculation (kg, default 100) */
  totalMass?: number;
};
