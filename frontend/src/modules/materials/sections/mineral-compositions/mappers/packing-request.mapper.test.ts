import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toPackingArrays } from './packing-request.mapper';

describe('mineral-compositions › packing-request', () => {
  it('builds parallel arrays with d50 as the diameter', () => {
    expect(toPackingArrays(CASTABLE_MIX_FRACTIONS)).toEqual({
      massFractions: [0.35, 0.25, 0.2, 0.15, 0.05],
      densities_kgm3: [3550, 3550, 3900, 2900, 3950],
      diameters_mm: [4.5, 2, 0.2, 0.01, 0.002],
    });
  });
});
