export type PackingCpmInput = {
  massFractions: number[];
  densities_kgm3: number[];
  /** d50 of each fraction. */
  diameters_mm: number[];
  compactionPressure_MPa?: number;
};
