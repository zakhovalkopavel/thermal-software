/**
 * Peng–Robinson (1976) EOS coefficients.
 * Refs: [Poling5] §4; Peng & Robinson, Ind. Eng. Chem. Fundam. 15 (1976).
 */
export const PENG_ROBINSON = {
  /** a_c = Ω_a R² T_c² / P_c */
  OMEGA_A: 0.45724,
  /** b = Ω_b R T_c / P_c */
  OMEGA_B: 0.07780,
  /** κ = κ0 + κ1 ω − κ2 ω² */
  KAPPA_0: 0.37464,
  KAPPA_1: 1.54226,
  KAPPA_2: 0.26992,
  /** brentq tolerance on compressibility factor Z [-] */
  BRENTQ_TOL_Z: 1e-12,
  /** Lower Z bracket just above B */
  Z_BRACKET_EPS: 1e-8,
  /** Initial upper Z bracket for the gas root */
  Z_BRACKET_HIGH: 3,
  /** Max expansions of the Z bracket when signs do not oppose */
  Z_BRACKET_EXPAND_MAX: 12,
} as const;
