import { describe, expect, it } from 'vitest';
import type { MixThermalResult } from '../../../types/mix-thermal-result.type';
import { toRawMaterialThermalPoints } from './raw-material-thermal-points.mapper';

const RESULT: MixThermalResult = {
  porosity: 0.2,
  lossOnIgnition_wt: 0,
  firedPhases_wt: { SiC: 99 },
  heatCapacityCoverage_wt: 100,
  trueDensity_kgm3: 3210,
  bulkDensity_kgm3: 2568,
  materials: [],
  points: [
    { temperature_C: 20, lambdaSolid_WmK: 122, lambdaEffective_WmK: 88.8, specificHeat_JkgK: 657.3, thermalDiffusivity_m2s: 5.26e-5 },
    { temperature_C: 600, lambdaSolid_WmK: 41.8, lambdaEffective_WmK: 30.4, specificHeat_JkgK: 1157.2, thermalDiffusivity_m2s: 1.02e-5 },
  ],
  warnings: [],
};

describe('raw-materials › raw-material-thermal-points', () => {
  it('maps effective λ, Cp, bulk density and diffusivity per temperature', () => {
    expect(toRawMaterialThermalPoints('silicon_carbide', RESULT)).toEqual([
      { materialId: 'silicon_carbide', temperature_C: 20, porosity: 0.2, lambda_WmK: 88.8, cp_JkgK: 657.3, rho_kgm3: 2568, diffusivity_m2s: 5.26e-5 },
      { materialId: 'silicon_carbide', temperature_C: 600, porosity: 0.2, lambda_WmK: 30.4, cp_JkgK: 1157.2, rho_kgm3: 2568, diffusivity_m2s: 1.02e-5 },
    ]);
  });
});
