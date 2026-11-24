/** Packing calculation result. */
export type PackingResult = {
  /** Packing model used */
  model: 'CPM' | 'Furnas';

  /** Packing fraction (0-1) — volume of solids / total volume */
  packingFraction_phi: number;

  /** Initial porosity (0-1) — volume of voids / total volume */
  porosity_initial: number;

  /** Effective packing density — dimensionless */
  effectivePackingDensity: number;
};
