/** Model parameters (VFT or Arrhenius). */
export type ModelParameters = {
  /** Pre-exponential constant */
  A: number;

  /** Activation energy parameter (K) */
  B: number;

  /** VFT temperature (K), only for VFT model */
  T0?: number;

  /** Valid temperature range for this model */
  temperatureRange: {
    min_C: number;
    max_C: number;
  };
};
