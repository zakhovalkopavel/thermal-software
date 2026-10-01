import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toBlendOptimizationInput } from './blend-request.mapper';

describe('mineral-compositions › blend-request', () => {
  it('sends fractions as 0–1 with size, density and fixed flag, plus the options', () => {
    const options = { qValues: [0.21, 0.25], methods: ['Andreasen' as const], packingModels: ['CPM' as const], scenarios: ['Vibratable' as const] };
    const input = toBlendOptimizationInput(CASTABLE_MIX_FRACTIONS.slice(3), options);
    expect(input).toEqual({
      fractions: [
        { materialId: 'cac_ca70', dMin_mm: 0.001, dMax_mm: 0.045, massFraction: 0.15, isFixed: true, density_kgm3: 2900 },
        { materialId: 'alumina_reactive', dMin_mm: 0.0005, dMax_mm: 0.005, massFraction: 0.05, isFixed: false, density_kgm3: 3950 },
      ],
      options,
    });
  });
});
