/**
 * Chapman–Enskog dilute-gas transport prefactors (Poling 5th ed. / Neufeld).
 * σ in Å, M in g/mol, T in K, P in atm unless noted.
 */
export const CHAPMAN_ENSKOG = {
  /**
   * Binary diffusivity [cm²/s]:
   * D = D_PREFACTOR_CM2S · T^(3/2) · √(1/M_A+1/M_B) / (P_atm · σ² · Ω_D)
   */
  D_PREFACTOR_CM2S: 1.858e-3,
  /**
   * Viscosity [μP]: μ = MU_PREFACTOR_MICROP · √(M·T) / (σ² · Ω_v)
   * Convert to Pa·s with MU_MICROP_TO_PA_S.
   */
  MU_PREFACTOR_MICROP: 26.69,
  /** μP → Pa·s */
  MU_MICROP_TO_PA_S: 1e-7,
  /** kg/mol → g/mol for CE formulas */
  KG_MOL_TO_G_MOL: 1000,
  /**
   * Stockmayer Ω correction (engineering form used with Svehla / Itean practice):
   * Ω*_polar ≈ Ω*_LJ + STOCKMAYER_OMEGA_V_COEFF · δ² / T*
   */
  STOCKMAYER_OMEGA_V_COEFF: 0.2,
  STOCKMAYER_OMEGA_D_COEFF: 0.19,
  /**
   * Treat as polar for CE Stockmayer when |μ| ≥ this [Debye],
   * if stockmayerDelta is absent.
   */
  POLAR_DIPOLE_DEBYE_MIN: 0.1,
} as const;
