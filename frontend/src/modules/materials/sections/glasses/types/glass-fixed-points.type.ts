export type GlassFixedPoints = {
  meltingPoint_C: number;
  workingPoint_C: number;
  flowPoint_C?: number;
  softeningPoint_C: number;
  annealingPoint_C: number;
  strainPoint_C: number;
  spans?: {
    meltingToStrain_C: number;
    workingToSoftening_C: number;
    softeningToAnnealing_C: number;
    annealingToStrain_C: number;
  };
};
