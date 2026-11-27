/** Input of a phase-equilibrium engine: the reacted matrix at one temperature. */
export type PhaseEquilibriumEngineInput = {
  /** Oxide composition of the matrix [wt%] */
  composition: Record<string, number>;

  /** Temperature [°C] */
  temperature_C: number;

  /** Mass of the matrix [kg] */
  totalMass: number;
};
