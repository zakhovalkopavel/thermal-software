import type { ShrinkageResult } from '../../../src/modules/materials/sections/mineral-compositions/types/shrinkage-result.type';

const stage = (name: string, temperatures_C: number[], shrinkage_linear_percent: number[]) => ({
  name,
  temperatures_C,
  shrinkage_volumetric_percent: shrinkage_linear_percent.map((value) => value * 3),
  shrinkage_linear_percent,
  relativeDensity: temperatures_C.map(() => 0.8),
  description: name,
});

export const SHRINKAGE_RESULT: ShrinkageResult = {
  drying: stage('Drying', [110], [0.1]),
  firing: [stage('Sintering 1000 °C', [1000], [0.3]), stage('Sintering 1400 °C', [1400], [0.9])],
  total: stage('Total', [1000, 1400], [0.4, 1.0]),
  metadata: {
    greenPorosity_percent: 18,
    finalPorosity_percent: 15.5,
    maxShrinkage_volumetric_percent: 3,
    tempAtMaxShrinkage_C: 1400,
    method: 'master-sintering-curve',
  },
  warnings: [],
};
