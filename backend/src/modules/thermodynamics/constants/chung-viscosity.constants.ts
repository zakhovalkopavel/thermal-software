/**
 * Chung et al. (1988) dense-gas viscosity coefficients (Poling 5th ed. Ch. 9).
 * E_i = a_i + b_i·ω + c_i·μ_r⁴ + d_i·κ.
 * Do not use Table 10-3 (thermal conductivity).
 * Refs: [Chung1988], [Poling5] §§9-5–9-7.
 */
export const CHUNG_VISCOSITY = {
  /** Dilute μ [μP]: 40.785 · Fc · √(M·T) / (Vc^{2/3} · Ω_v); M g/mol, Vc cm³/mol */
  DILUTE_PREFACTOR_MICROP: 40.785,
  /** Dense μ [μP]: μ* · 36.344 · √(M·Tc) / Vc^{2/3} */
  DENSE_PREFACTOR_MICROP: 36.344,
  /** μP → Pa·s */
  MU_MICROP_TO_PA_S: 1e-7,
  /** T* = T_STAR_FROM_TR · T/Tc (same as 1/EPSILON_FROM_TC) */
  T_STAR_FROM_TR: 1.2593,
  /** Fc = 1 − FC_OMEGA·ω + FC_MUR4·μ_r⁴ + κ */
  FC_OMEGA: 0.2756,
  FC_MUR4: 0.059035,
  /**
   * Poling Ch. 9 viscosity E-table rows i = 1…10; each `[a_i, b_i, c_i, d_i]`.
   */
  TABLE_E: [
    [6.324, 50.412, -51.68, 1189.0],
    [1.210e-3, -1.154e-3, -6.257e-3, 0.03728],
    [5.283, 254.209, -168.48, 3898.0],
    [6.623, 38.096, -8.464, 31.42],
    [19.745, 7.63, -14.354, 31.53],
    [-1.9, -12.537, 4.985, -18.15],
    [24.275, 3.449, -11.291, 69.35],
    [0.7972, 1.117, 0.01235, -4.117],
    [-0.2381, 0.0677, -0.8163, 4.025],
    [0.06863, 0.3479, 0.5926, -0.727],
  ] as const,
} as const;
