export type MixThermalMaterial = {
  materialId: string;
  firedMassFraction: number;
  volumeFraction: number;
  firedPhases_wt: Record<string, number>;
  trueDensity_kgm3: number;
  lambdaReference_WmK: number;
  lambdaReferenceSource: 'library' | 'group-median';
  conductionLaw: 'phonon' | 'electronic';
  heatCapacityCoverage_wt: number;
};
