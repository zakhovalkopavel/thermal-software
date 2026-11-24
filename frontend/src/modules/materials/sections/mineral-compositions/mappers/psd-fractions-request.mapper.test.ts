import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toPsdFractions } from './psd-fractions-request.mapper';

describe('mineral-compositions › psd-fractions-request', () => {
  it('sends sizes, 0–1 mass and the fixed flag', () => {
    expect(toPsdFractions(CASTABLE_MIX_FRACTIONS.slice(2, 4))).toEqual([
      { dMin_mm: 0.1, dMax_mm: 0.3, massFraction: 0.2, isFixed: false },
      { dMin_mm: 0.001, dMax_mm: 0.045, massFraction: 0.15, isFixed: true },
    ]);
  });
});
