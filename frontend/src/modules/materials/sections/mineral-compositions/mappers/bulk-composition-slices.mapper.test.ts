import { describe, expect, it } from 'vitest';
import type { MixCompositionResult } from '../../../types/mix-composition-result.type';
import { toBulkCompositionSlices } from './bulk-composition-slices.mapper';

const RESULT: MixCompositionResult = {
  basis: 'fired',
  lossOnIgnition_wt: 0.4,
  acceptedOxides_wt: { Al2O3: 93.1, CaO: 4.3, SiO2: 0.4 },
  acceptedOxides_normalized: { Al2O3: 95.2, CaO: 4.4, SiO2: 0.4 },
  otherOxides_wt: { P2O5: 0.2, Cr2O3: 0.3 },
  nonOxideComponents_wt: { carbide: 1.5, carbon: 0 },
  droppedMetals_wt: 0,
  trueDensity_kgm3: 3780,
  warnings: [],
};

describe('mineral-compositions › bulk-composition-slices', () => {
  it('orders accepted oxides by size, then hatched other oxides and non-oxides', () => {
    expect(toBulkCompositionSlices(RESULT, { ...RESULT.acceptedOxides_wt, MgO: 0 })).toMatchInlineSnapshot(`
      [
        {
          "name": "Al2O3",
          "y": 93.1,
        },
        {
          "name": "CaO",
          "y": 4.3,
        },
        {
          "name": "SiO2",
          "y": 0.4,
        },
        {
          "hatched": true,
          "name": "Other oxides",
          "y": 0.5,
        },
        {
          "hatched": true,
          "name": "carbide",
          "y": 1.5,
        },
      ]
    `);
  });

  it('omits the other-oxides slice when there are none', () => {
    const slices = toBulkCompositionSlices({ ...RESULT, otherOxides_wt: {}, nonOxideComponents_wt: {} }, { Al2O3: 100 });
    expect(slices).toEqual([{ name: 'Al2O3', y: 100 }]);
  });
});
