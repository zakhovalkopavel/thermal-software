/** Crystalline phase reported by a phase-equilibrium engine. */
export type PhaseEquilibriumCrystal = {
  /** Stable identifier, e.g. `corundum` */
  phaseId: string;

  /** Display name, e.g. `Corundum` */
  phase: string;

  /** Chemical formula, e.g. `Al2O3` */
  formula: string;

  /** Amount [% of the equilibrated matrix] */
  percent: number;
};
