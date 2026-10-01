import { describe, expect, it } from 'vitest';
import { isEmissivityClamped } from './is-emissivity-clamped.mapper';

const RANGE = { min: 600, max: 1400 };

describe('materials › is-emissivity-clamped', () => {
  it('is false inside the range, including its limits', () => {
    expect(isEmissivityClamped(600, RANGE)).toBe(false);
    expect(isEmissivityClamped(1000, RANGE)).toBe(false);
    expect(isEmissivityClamped(1400, RANGE)).toBe(false);
  });

  it('is true outside the range', () => {
    expect(isEmissivityClamped(599, RANGE)).toBe(true);
    expect(isEmissivityClamped(1401, RANGE)).toBe(true);
  });
});
