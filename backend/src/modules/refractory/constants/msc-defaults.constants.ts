/**
 * Default Master Sintering Curve (MSC) parameters for alumina-silicate systems.
 * Su & Johnson (1996).
 */
export const MSC_DEFAULTS = {
  activationEnergy_Jmol: 500000,
  prefactor: 1e13,
  targetDensity: 0.95,
  /** Empirical constant in ρ_rel(Θ) = 1 / (1 + C × exp(-k × Θ)) */
  densityCurveC: 15.0,
  /** Scaling factor in the MSC density curve */
  densityCurveK: 1e-12,
  /** Typical green relative density for castables */
  initialGreenDensity: 0.6,
  /** Typical alumina-silicate theoretical density (kg/m³) */
  theoreticalDensity_kgm3: 3500,
} as const;
