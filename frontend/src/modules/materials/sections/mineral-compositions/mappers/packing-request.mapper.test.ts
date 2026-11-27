import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toPackingArrays, toPackingQueryKey } from './packing-request.mapper';

describe('mineral-compositions › packing-request', () => {
  it('builds parallel arrays with d50 as the diameter and normalises masses', () => {
    const arrays = toPackingArrays(CASTABLE_MIX_FRACTIONS.slice(0, 2));
    expect(arrays.massFractions.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(arrays.diameters_mm).toEqual([4.5, 2]);
  });

  it('changes the query key when material or mass changes', () => {
    const base = toPackingQueryKey(CASTABLE_MIX_FRACTIONS.slice(0, 2));
    const massChanged = toPackingQueryKey([
      { ...CASTABLE_MIX_FRACTIONS[0], massPercent: 50 },
      { ...CASTABLE_MIX_FRACTIONS[1], massPercent: 50 },
    ]);
    const materialChanged = toPackingQueryKey([
      { ...CASTABLE_MIX_FRACTIONS[0], materialId: 'alumina_calcined' },
      CASTABLE_MIX_FRACTIONS[1],
    ]);
    expect(massChanged).not.toEqual(base);
    expect(materialChanged.materialIds).not.toEqual(base.materialIds);
  });
});
