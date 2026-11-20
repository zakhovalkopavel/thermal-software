/** Phase stability information. */
export type PhaseStability = {
  /** Phase name */
  phase: string;

  /** Stable at current temperature */
  stableAtTemperature: boolean;

  /** Temperature range for stability (°C) */
  stabilityRange: { min: number; max: number };

  /** Metastable under certain conditions */
  metastable?: boolean;

  /** Conditions for metastability */
  metastabilityConditions?: string;
};
