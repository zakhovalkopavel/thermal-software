/**
 * Defaults for CoolProp `simplified_Olchowy_Sengers` critical λ
 * (CoolProp `ConductivityCriticalSimplifiedOlchowySengersData`).
 * Refs: [NISTIR8209], [CoolProp].
 */
export const OLCHOWY_SENGERS = {
  /** Boltzmann k [J/K] as used in CoolProp transport */
  BOLTZMANN_J_K: 1.3806488e-23,
  /** Universal amplitude R_D [-] */
  R0: 1.03,
  /** Critical exponent γ [-] */
  GAMMA_EXPONENT: 1.239,
  /** Critical exponent ν [-] */
  NU: 0.63,
  /** Amplitude Γ [-] */
  GAMMA: 0.0496,
  /** Correlation-length amplitude ζ₀ [m] */
  ZETA0_M: 1.94e-10,
  /** Cutoff wave number q_D [1/m] */
  QD_PER_M: 2e9,
  /** Default T_ref / T_c when fluid omits T_ref */
  T_REF_OVER_TC: 1.5,
  /** Treat X−X_ref below this as no enhancement (CoolProp: 10·DBL_EPSILON) */
  NUM_FLOOR: 10 * Number.EPSILON,
  /** Relative step for finite-difference Helmholtz derivatives */
  FD_REL_STEP: 1e-6,
} as const;
