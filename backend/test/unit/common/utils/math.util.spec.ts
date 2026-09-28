import { logMean } from '../../../../src/common/utils/math.util';

describe('logMean', () => {
  it('equal values - returns the same value', () => {
    expect(logMean(1, 1)).toBe(1);
  });

  it('different values - returns the logarithmic mean for 2 and 1', () => {
    const expected = (2 - 1) / Math.log(2); // Lm = (x1 - x2) / ln(x1 / x2)
    expect(logMean(2, 1)).toBeCloseTo(expected, 5);
  });

  it('different values - returns e minus 1 for e and 1', () => {
    const expected = Math.E - 1; // ln(e / 1) = 1
    expect(logMean(Math.E, 1)).toBeCloseTo(expected, 4);
  });

  it('different values - returns the logarithmic mean for 100 and 10', () => {
    const expected = (100 - 10) / Math.log(100 / 10); // 90 / ln(10)
    expect(logMean(100, 10)).toBeCloseTo(expected, 3);
  });

  it('different arguments - is symmetric', () => {
    const a = 12;
    const b = 3;

    expect(logMean(a, b)).toBeCloseTo(logMean(b, a), 10);
  });

  it('different arguments - stays between the minimum and maximum values', () => {
    const result = logMean(10, 100);

    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(100);
  });

  it('near-equal values - returns approximately the shared value without NaN', () => {
    const result = logMean(1 + 1e-11, 1);

    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBeCloseTo(1, 10);
  });
});
