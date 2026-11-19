/**
 * Chung et al. (1988) / Poling 5th ed. Table 10-3 coefficients for dense-gas λ.
 * B_i = a_i + b_i·ω + c_i·μ_r⁴ + d_i·κ  (Eq. 10-5.9).
 *
 * Refs: [Chung1988], working equations [Poling5] §10-5.
 */
export const CHUNG_THERMAL_CONDUCTIVITY = {
  /** Prefactor in Eq. 10-5.5 [W/(m·K)] with η in Pa·s and M' in kg/mol */
  LAMBDA_PREFACTOR: 31.2,
  /** Prefactor for q in Eq. 10-5.5; Vc in cm³/mol, M' in kg/mol */
  Q_PREFACTOR: 3.586e-3,
  /** σ_i = SIGMA_FROM_VC · Vc_i^{1/3} with Vc in cm³/mol (Poling Eq. 9-5.32) */
  SIGMA_FROM_VC: 0.809,
  /** ε_i/k = Tc_i / EPSILON_FROM_TC (Poling Eq. 9-5.34) */
  EPSILON_FROM_TC: 1.2593,
  /** μ_r = DIPOLE_REDUCED_PREFACTOR · μ / √(Vc·Tc); μ in Debye, Vc in cm³/mol */
  DIPOLE_REDUCED_PREFACTOR: 131.3,
  /** C·m per Debye (compound-data dipole is SI) */
  COULOMB_METRE_PER_DEBYE: 3.33564e-30,
  /** Association factor κ — zero for non-associating gases in this implementation */
  ASSOCIATION_FACTOR: 0,
  /**
   * Chung dense-gas λ coefficients \(B_i = a_i + b_i ω + c_i μ_r⁴ + d_i κ\) (Eq. 10-5.9).
   *
   * Name: there is no separate scientific name — `TABLE_10_3` is Poling 5th ed.
   * Chapter 10, **Table 10-3** (p. 10.23), which reprints the \(a_i…d_i\) set from
   * Chung et al. (1988) for high-pressure thermal conductivity. (Chung viscosity
   * uses a different coefficient table in Poling Ch. 9 — do not mix them.)
   *
   * Rows i = 1…7; each row is `[a_i, b_i, c_i, d_i]`. Used to form \(B_1…B_7\) in
   * \(G_2\) and the density terms of Eq. 10-5.5.
   */
  TABLE_10_3: [
    [2.4166, 0.74824, -0.91858, 121.72],
    [-0.50924, -1.5094, -49.991, 69.983],
    [6.6107, 5.6207, 64.76, 27.039],
    [14.543, -8.9139, -5.6379, 74.344],
    [0.79274, 0.82019, -0.69369, 6.3173],
    [-5.8634, 12.801, 9.5893, 65.529],
    [91.089, 128.11, -54.217, 523.81],
  ] as const,
  /** Ψ numerator / denominator coefficients (Poling under Eq. 10-3.14) */
  PSI: {
    ALPHA0: 0.215,
    ALPHA1: 0.28288,
    BETA1: 1.061,
    Z1: 0.26665,
    DEN_0: 0.6366,
    DEN_BETA_Z: 1,
    DEN_ALPHA_BETA: 1.061,
  },
  BETA_OMEGA: {
    C0: 0.7862,
    C1: -0.7109,
    C2: 1.3168,
  },
  Z_TR: {
    C0: 2,
    C1: 10.5,
  },
} as const;
