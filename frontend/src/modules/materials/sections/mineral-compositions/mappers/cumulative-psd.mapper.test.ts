import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toCumulativePsd } from './cumulative-psd.mapper';

describe('mineral-compositions › cumulative-psd', () => {
  it('accumulates % finer from the finest fraction, starting at 0 at its dMin', () => {
    const masses = CASTABLE_MIX_FRACTIONS.map((fraction) => fraction.massPercent / 100);
    expect(toCumulativePsd(CASTABLE_MIX_FRACTIONS, masses).map(([d, y]) => [d, Number(y.toFixed(6))])).toEqual([
      [0.0005, 0],
      [0.005, 5],
      [0.045, 20],
      [0.3, 40],
      [3, 65],
      [6, 100],
    ]);
  });

  it('merges fractions that end at the same size and skips the 0 point for dMin = 0', () => {
    expect(
      toCumulativePsd(
        [
          { dMin_mm: 0, dMax_mm: 1 },
          { dMin_mm: 0.5, dMax_mm: 1 },
        ],
        [1, 1],
      ),
    ).toEqual([[1, 100]]);
  });

  it('is empty for no mass', () => {
    expect(toCumulativePsd([], [])).toEqual([]);
    expect(toCumulativePsd([{ dMin_mm: 1, dMax_mm: 3 }], [0])).toEqual([]);
  });
});
