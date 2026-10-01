import { describe, expect, it } from 'vitest';
import type { MixCompositionResult } from '../../../types/mix-composition-result.type';
import { toCompositionCoverage } from './composition-coverage.mapper';

const RESULT: MixCompositionResult = {
  basis: 'fired',
  lossOnIgnition_wt: 12.4,
  acceptedOxides_wt: { SiO2: 52.1, Al2O3: 41.3, Fe2O3: 1.2, TiO2: 1.5 },
  acceptedOxides_normalized: { SiO2: 54.8, Al2O3: 43.4, Fe2O3: 1.2, TiO2: 0.6 },
  otherOxides_wt: { P2O5: 0.3 },
  nonOxideComponents_wt: {},
  droppedMetals_wt: 0,
  trueDensity_kgm3: 2650,
  warnings: [],
};

describe('raw-materials › composition-coverage', () => {
  it('sums the accepted oxides', () => {
    expect(toCompositionCoverage(RESULT)).toBeCloseTo(96.1, 10);
  });

  it('is zero without accepted oxides', () => {
    expect(toCompositionCoverage({ ...RESULT, acceptedOxides_wt: {} })).toBe(0);
  });
});
