/**
 * When CoolProp and Peng–Robinson are unavailable, ideal gas is allowed only
 * inside this envelope (else throw — error would be large).
 */
export const IDEAL_GAS_DENSITY_LIMITS = {
  /**
   * Max reduced pressure P/P_c for ideal-gas density.
   * Above this, |Z−1| is typically non-negligible for process gases.
   */
  MAX_REDUCED_PRESSURE: 0.1,
  /**
   * Absolute max P [Pa] when P_c is unknown (≈ 1.5 bar).
   * Conservative without a critical scale.
   */
  MAX_P_PA_WITHOUT_PC: 1.5e5,
} as const;
