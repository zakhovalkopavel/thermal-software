import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { isFractionComplete } from './is-fraction-complete.mapper';

const COMPLETE = CASTABLE_MIX_FRACTIONS[0];

describe('mineral-compositions › is-fraction-complete', () => {
  it('accepts a fully filled row', () => {
    expect(isFractionComplete(COMPLETE)).toBe(true);
  });

  it.each([
    ['no material', { materialId: null }],
    ['no size', { dMin_mm: null }],
    ['no d50', { d50_mm: null }],
    ['dMax not above dMin', { dMax_mm: 3 }],
    ['no mass', { massPercent: null }],
    ['zero mass', { massPercent: 0 }],
    ['no density', { density_kgm3: null }],
    ['zero density', { density_kgm3: 0 }],
  ])('rejects a row with %s', (_, patch) => {
    expect(isFractionComplete({ ...COMPLETE, ...patch })).toBe(false);
  });
});
