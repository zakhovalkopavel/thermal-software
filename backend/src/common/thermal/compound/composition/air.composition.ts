/**
 * Exact dry-air mole-fraction composition per ICAO Standard Atmosphere (Doc 7488/3, 1993)
 * and ISO 2533:1975.
 *
 * ICAO standard dry air (volume fractions):
 *   N2   78.084 %
 *   O2   20.946 %
 *   Ar    0.934 %
 *   CO2   0.040 %   (ICAO reference; current atmospheric ≈ 0.042 %, ICAO uses 0.040 %)
 *
 * Trace noble gases (Ne 18 ppm, He 5 ppm, Kr 1 ppm) are omitted — their combined
 * contribution to any thermophysical property is < 0.001 %.
 *
 * All four species are present in GAS_REGISTRY (Ar was added for this purpose),
 * so this composition can be passed directly to mixture-property calculations.
 *
 * References:
 *   ICAO Doc 7488/3 — Manual of the ICAO Standard Atmosphere, 3rd ed. (1993), Table 1.
 *   ISO 2533:1975   — Standard Atmosphere, Section 2.
 */
export const AIR_MOLE_COMPOSITION = {
  N2:  0.78084,
  O2:  0.20946,
  Ar:  0.00934,
  CO2: 0.00040,
} as const;
