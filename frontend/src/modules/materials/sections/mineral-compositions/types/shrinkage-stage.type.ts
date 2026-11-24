export type ShrinkageStage = {
  name: string;
  temperatures_C: number[];
  shrinkage_volumetric_percent: number[];
  shrinkage_linear_percent: number[];
  relativeDensity: number[];
  description: string;
};
