import { describe, expect, it } from 'vitest';
import { toPhaseCompositionBars } from './phase-composition-bars.mapper';

describe('mineral-compositions › phase-composition-bars', () => {
  it('compares liquid and solid per oxide; null where a phase lacks the oxide', () => {
    expect(
      toPhaseCompositionBars({
        liquid: { percent: 22, mass: 22, composition: { SiO2: 61.2, Al2O3: 18.4, CaO: 20.4 } },
        solid: { percent: 78, mass: 78, composition: { Al2O3: 72.1, SiO2: 27.9, MgO: 0 }, mineralPhases: ['mullite'] },
        metadata: { temperature: 1400, totalMass: 100, eutecticTemperature: 1345, estimatedLiquidus: 1810 },
        warnings: [],
      }),
    ).toEqual({
      categories: ['SiO2', 'Al2O3', 'CaO', 'MgO'],
      series: [
        { name: 'Liquid', data: [61.2, 18.4, 20.4, null] },
        { name: 'Solid', data: [27.9, 72.1, null, 0] },
      ],
    });
  });
});
