/**
 * Phase for flat fluid property / dimensionless resolution.
 * Default is gas (backward compatible). Liquid uses catalogue liquid transport equations.
 */
export enum FluidPhase {
  Gas = 'gas',
  Liquid = 'liquid',
}
