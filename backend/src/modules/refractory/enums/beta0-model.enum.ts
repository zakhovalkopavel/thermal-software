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
