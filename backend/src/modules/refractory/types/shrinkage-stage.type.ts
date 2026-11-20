/** Single shrinkage stage result. */
export type ShrinkageStage = {
  /** Stage name (drying, firing, total) */
  name: string;

  /** Temperature points for this stage (°C) */
  temperatures_C: number[];

  /** Volumetric shrinkage at each temperature (%) */
  shrinkage_volumetric_percent: number[];

  /** Linear shrinkage at each temperature (%) */
  shrinkage_linear_percent: number[];

  /** Relative density at each temperature (0-1) */
  relativeDensity: number[];

  /** Stage description */
  description: string;
};
