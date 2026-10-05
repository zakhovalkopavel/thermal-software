import type { MixThermalMaterial } from './mix-thermal-material.type';
import type { MixThermalPoint } from './mix-thermal-point.type';

export type MixThermalResult = {
  porosity: number;
  lossOnIgnition_wt: number;
  firedPhases_wt: Record<string, number>;
  heatCapacityCoverage_wt: number;
  trueDensity_kgm3: number;
  bulkDensity_kgm3: number;
  materials: MixThermalMaterial[];
  points: MixThermalPoint[];
  warnings: string[];
};
