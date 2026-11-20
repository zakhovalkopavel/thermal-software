/**
 * How far a composition extrapolates beyond a model's validated component ranges.
 */
export enum ExtrapolationRisk {
  NONE     = 'NONE',      // All components within validated ranges
  MINOR    = 'MINOR',     // Small deviations (<10%)
  MODERATE = 'MODERATE',  // Moderate deviations (10–25%)
  SEVERE   = 'SEVERE',    // Large deviations (>25%) or unknown system
}
