/** Crystalline phase of the fired body with its origin. */
export type PhaseEquilibriumResponseCrystal = {
  /** Stable identifier */
  phaseId: string;

  /** Display name */
  phase: string;

  /** Formula */
  formula: string;

  /** Amount [% of the fired body] */
  percent: number;

  /** Mass [kg] */
  mass: number;

  /** Origin of the amount [% of the fired body] */
  origin: {
    matrix: number;
    unreactedUnchanged: number;
    unreactedTransformed: number;
  };
};
