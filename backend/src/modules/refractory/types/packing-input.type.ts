/** Base packing calculation input. */
export type PackingInput = {
  /** Mass fractions of each size class (must sum to 1) */
  massFractions: number[];

  /** Bulk densities of materials (kg/m³) */
  densities_kgm3: number[];

  /** Mean diameters of each size class (mm) */
  diameters_mm: number[];
};
