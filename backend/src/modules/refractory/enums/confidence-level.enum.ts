/**
 * Confidence in a glass/slag viscosity prediction relative to validated ranges.
 */
export enum ConfidenceLevel {
  HIGH     = 'HIGH',      // Within validated ranges, established system
  MEDIUM   = 'MEDIUM',    // Minor deviations or near boundaries
  LOW      = 'LOW',       // Significant deviations or near model boundary
  VERY_LOW = 'VERY_LOW',  // Major extrapolation
}
