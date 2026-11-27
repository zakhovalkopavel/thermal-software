export type PhaseEquilibriumCrystal = {
  phaseId: string;
  phase: string;
  formula: string;
  /** % of the fired body */
  percent: number;
  /** kg */
  mass?: number;
};
