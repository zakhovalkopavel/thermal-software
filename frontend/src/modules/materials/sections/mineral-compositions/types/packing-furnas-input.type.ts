export type PackingFurnasInput = {
  massFractions: number[];
  densities_kgm3: number[];
  /** d50 of each fraction. */
  diameters_mm: number[];
  /** 0–1 */
  efficiencyFactor?: number;
};
