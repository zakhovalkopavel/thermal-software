import { describe, expect, it } from 'vitest';
import { formatValue } from './format';

describe('calc › formatValue', () => {
  it('shows a dash for missing or non-finite values', () => {
    expect([null, undefined, Number.NaN, Number.POSITIVE_INFINITY].map((value) => formatValue(value))).toEqual(['—', '—', '—', '—']);
  });

  it('formats typical engineering values to 4 significant digits without trailing zeros', () => {
    expect(
      [0, 1743.25, 34.1, 0.716, 1.5, 120, -273.15, 0.0259, 999999].map((value) => formatValue(value)),
    ).toMatchInlineSnapshot(`
      [
        "0",
        "1743",
        "34.1",
        "0.716",
        "1.5",
        "120",
        "-273.1",
        "0.0259",
        "999999",
      ]
    `);
  });

  it('switches to powers of ten outside [1e-3, 1e6)', () => {
    expect([1e6, 5000000, 1.79e-5, -2.5e-4, 0.0005, 9.9996e5, 9.99996e6].map((value) => formatValue(value))).toMatchInlineSnapshot(`
      [
        "1.000·10⁶",
        "5.000·10⁶",
        "1.790·10⁻⁵",
        "-2.500·10⁻⁴",
        "5.000·10⁻⁴",
        "999960",
        "1.000·10⁷",
      ]
    `);
  });

  it('honours the digits argument', () => {
    expect([formatValue(1743.25, 2), formatValue(0.012345, 2), formatValue(1.79e-5, 2)]).toMatchInlineSnapshot(`
      [
        "1743",
        "0.012",
        "1.8·10⁻⁵",
      ]
    `);
  });
});
