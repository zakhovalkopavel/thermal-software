import { describe, expect, it } from 'vitest';
import { blendResult } from '../../../../../../tests/fixtures/inputs/blend-result';
import { toAppliedMassPercents } from './applied-mass-percents.mapper';

describe('mineral-compositions › applied-mass-percents', () => {
  it('maps result fractions (0–1) to mass % by fraction id in request order', () => {
    const percents = toAppliedMassPercents(blendResult(), ['f1', 'f2', 'f3', 'f4', 'f5']);
    expect(Object.keys(percents)).toEqual(['f1', 'f2', 'f3', 'f4', 'f5']);
    expect(Object.values(percents).map((value) => Number(value.toFixed(6)))).toEqual([36, 24, 20, 15, 5]);
  });
});
