/**
 * Flow regime — used as optional override in DimensionlessInputDto
 * and as the authoritative regime type in NusseltResult.
 * Defined as an enum so Swagger/class-validator can reference its values directly.
 */
export enum FlowRegime {
  LAMINAR      = 'laminar',
  TURBULENT    = 'turbulent',
  TRANSITIONAL = 'transitional',
  NATURAL      = 'natural',
  MIXED        = 'mixed',
}
