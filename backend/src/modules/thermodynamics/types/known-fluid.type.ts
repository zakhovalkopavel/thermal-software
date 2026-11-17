/**
 * Named fluid on Mode B endpoints: a key of `FLUID_REGISTRY` (`common/thermal/compound/gas`)
 * or `gas_mix` (caller supplies `composition`; not a registry entry).
 *
 * There is no separate allowlist — the compound registry is the source of truth.
 */
export type KnownFluid = string;
