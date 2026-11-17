/**
 * Runtime array of all named fluids accepted by fluid-input DTOs.
 * Pure species map directly to Species enum values.
 * 'air' is a mixture alias (ICAO dry-air composition).
 * 'water' is accepted as an alias and normalized to 'H2O' before lookup.
 * 'gas_mix' requires a `composition` mole-fraction object alongside.
 *
 * This is the **single source of truth** — the KnownFluid type and Swagger
 * description strings are both derived from this array.
 */
export const KNOWN_FLUIDS = [
  'air', 'N2', 'O2', 'CO2', 'CO', 'H2', 'H2O', 'CH4',
  'SO2', 'SO3', 'NO', 'NO2', 'NH3', 'water', 'gas_mix',
] as const;

/**
 * Named fluids accepted by fluid-input DTOs (Mode B: fluid-by-name).
 * Derived from KNOWN_FLUIDS — add new fluids to the array above, not here.
 */
export type KnownFluid = typeof KNOWN_FLUIDS[number];

/**
 * Map API convenience aliases to registry / Species keys before property lookup.
 * `water` → `H2O`. `air` and `gas_mix` stay as-is (not pure-species keys).
 */
export function normalizeKnownFluid(fluid: KnownFluid): KnownFluid;
export function normalizeKnownFluid(fluid: KnownFluid | undefined): KnownFluid | undefined;
export function normalizeKnownFluid(fluid: KnownFluid | undefined): KnownFluid | undefined {
  if (fluid === 'water') return 'H2O';
  return fluid;
}

/**
 * Human-readable, comma-separated list of all known fluid keys for use in
 * Swagger @ApiProperty / @ApiPropertyOptional descriptions.
 *
 * Example output: "air", "N2", "O2", "CO2", …, "gas_mix"
 */
export const KNOWN_FLUID_DESCRIPTION: string =
  KNOWN_FLUIDS.map(f => `"${f}"`).join(', ');
