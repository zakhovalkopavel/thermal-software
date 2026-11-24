import { describe, expect, it } from 'vitest';
import { toCpComparisonBars } from './cp-comparison-bars.mapper';

describe('gases › cp-comparison-bars', () => {
  it('builds one bar per correlation, greys entries outside their range and returns the mean', () => {
    const result = toCpComparisonBars([
      { index: 0, type: 'NASA7', ref: 'Burcat', value: 29.12, rangeValid: true },
      { index: 1, type: 'Shomate', ref: 'NIST', value: 29.14, rangeValid: true },
      { index: 2, type: 'Polynomial', ref: 'Perry', value: 29.6, rangeValid: false },
    ]);
    expect(result.mean).toBeCloseTo(29.2867, 4);
    expect(result).toMatchInlineSnapshot(`
      {
        "categories": [
          "NASA7 (Burcat)",
          "Shomate (NIST)",
          "Polynomial (Perry)",
        ],
        "mean": 29.286666666666672,
        "series": [
          {
            "data": [
              {
                "color": undefined,
                "y": 29.12,
              },
              {
                "color": undefined,
                "y": 29.14,
              },
              {
                "color": "#bdbdbd",
                "y": 29.6,
              },
            ],
            "name": "Cp",
          },
        ],
      }
    `);
  });

  it('gives a zero mean for no entries', () => {
    expect(toCpComparisonBars([])).toEqual({ categories: [], series: [{ name: 'Cp', data: [] }], mean: 0 });
  });
});
