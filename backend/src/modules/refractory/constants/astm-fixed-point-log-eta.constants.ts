/**
 * ASTM glass-viscosity fixed-point targets as log₁₀(η / Pa·s).
 *
 * Universal for glass models (Lakatos, Fluegel, Hetherington, …).
 * Not applicable to slag models (Iida / Nakamoto), which have no
 * softening / annealing / strain points.
 *
 * References:
 * - ASTM C965-96 — measuring viscosity of glass above the softening point
 * - ASTM C338 — Littleton softening point (10^6.6 Pa·s)
 * - ASTM C336 — annealing (10^12) and strain (10^13.5) points
 */
export const ASTM_FIXED_POINT_LOG_ETA = {
  /** Melting point: η = 1 Pa·s */
  melting: 1.0,
  /** Working point: η = 10^3 Pa·s */
  working: 3.0,
  /** Flow point: η = 10^4 Pa·s */
  flow: 4.0,
  /** Softening point: η = 10^6.6 Pa·s (ASTM C338) */
  softening: 6.6,
  /** Annealing point: η = 10^12 Pa·s (ASTM C336) */
  annealing: 12.0,
  /** Strain point: η = 10^13.5 Pa·s (ASTM C336) */
  strain: 13.5,
} as const;
