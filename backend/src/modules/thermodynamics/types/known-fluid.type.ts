/**
 * Named fluids accepted by DimensionlessInputDto (Mode B: fluid-by-name).
 * Pure species map directly to the Species enum values.
 * 'air' and 'water' are convenience aliases.
 * 'gas_mix' requires a `composition` object alongside.
 */
export type KnownFluid =
  | 'air' | 'N2' | 'O2' | 'CO2' | 'CO' | 'H2' | 'H2O' | 'CH4'
  | 'SO2' | 'SO3' | 'NO' | 'NO2' | 'NH3' | 'water' | 'gas_mix';

