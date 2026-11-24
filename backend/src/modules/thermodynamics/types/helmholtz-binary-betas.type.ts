/** Oriented β/γ for one ordered CoolProp fluid pair (i, j). */
export type HelmholtzBinaryBetas = {
  betaT: number;
  gammaT: number;
  betaV: number;
  gammaV: number;
  /** Departure multiplier F_ij; 0 → no excess α^E */
  F: number;
};
