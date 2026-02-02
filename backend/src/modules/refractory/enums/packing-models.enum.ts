/**
 * Particle shape models for β₀ (virtual packing of monodisperse system)
 *
 * References:
 * - Johansen, V. & Andersen, P.J. (1991) "Particle packing and concrete properties"
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning" Table 2.1
 */
export enum Beta0Model {
  /** Spherical particles (glass beads, rounded aggregates): β₀ = 0.64 (RCP limit) */
  SPHERICAL = 'spherical',
  /** Sub-angular particles (natural sand, crushed rounded): β₀ = 0.60 */
  SUB_ANGULAR = 'sub_angular',
  /** Angular particles (crushed rock, typical refractory): β₀ = 0.56 */
  ANGULAR = 'angular',
  /** Flaky/elongated particles (mica, fibrous materials): β₀ = 0.50 */
  FLAKY = 'flaky',
}

/**
 * Maximum packing fraction models (φ_max) based on research and practical systems
 *
 * References:
 * - Studart, A.R. et al. (2006) "Processing Routes to Macroporous Ceramics: A Review"
 * - Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"
 * - de Larrard, F. (1999) Table 5.3: Typical concrete packing ranges
 * - Pileggi, R.G. et al. (2001) "Novel rheometer for refractory castables"
 */
export enum MaxPhiModel {
  /** Theoretical limit: FCC/HCP densest sphere packing = 0.7405 */
  THEORETICAL_FCC = 'theoretical_fcc',
  /** Typical well-graded concrete (no compaction): φ = 0.68–0.72 → use 0.72 */
  TYPICAL_CONCRETE = 'typical_concrete',
  /** Dense castable (vibrated, optimized PSD): φ = 0.74–0.78 → use 0.76 */
  DENSE_CASTABLE = 'dense_castable',
  /** High-performance (micro-fillers, high compaction): φ = 0.78–0.82 → use 0.80 */
  HIGH_PERFORMANCE = 'high_performance',
  /** Legacy engineering cap (conservative, above realistic): φ = 0.85 */
  LEGACY_CONSERVATIVE = 'legacy_conservative',
}

