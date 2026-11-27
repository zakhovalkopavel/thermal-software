import { describe, expect, it } from 'vitest';
import type { MixThermalResult } from '../../../types/mix-thermal-result.type';
import { toConductivitySweepSeries } from './conductivity-sweep-series.mapper';

const result = (porosity: number, points: Array<[number, number]>): MixThermalResult =>
  ({
    porosity,
    lossOnIgnition_wt: 0,
    firedPhases_wt: { Al2O3: 100 },
    heatCapacityCoverage_wt: 100,
    trueDensity_kgm3: 3550,
    bulkDensity_kgm3: 3550 * (1 - porosity),
    materials: [],
    points: points.map(([temperature_C, lambdaEffective_WmK]) => ({
      temperature_C,
      lambdaSolid_WmK: lambdaEffective_WmK / 0.7,
      lambdaEffective_WmK,
      specificHeat_JkgK: 1000,
      thermalDiffusivity_m2s: 1e-6,
    })),
    warnings: [],
  }) as MixThermalResult;

describe('mineral-compositions › conductivity-sweep-series', () => {
  it('builds a solid series for the requested porosity and a dashed dense series', () => {
    expect(toConductivitySweepSeries([result(0.2, [[1200, 5.2], [1000, 6.1]]), result(0, [[1000, 8], [1200, 7]])], 0.2)).toEqual([
      {
        name: 'P = 0.2',
        dashStyle: undefined,
        emphasis: true,
        data: [
          [1000, 6.1],
          [1200, 5.2],
        ],
      },
      {
        name: 'P = 0',
        dashStyle: 'Dash',
        emphasis: false,
        data: [
          [1000, 8],
          [1200, 7],
        ],
      },
    ]);
  });
});
