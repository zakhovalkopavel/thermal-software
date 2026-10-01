import { describe, expect, it } from 'vitest';
import { toCelsiusGrid } from './celsius-grid.mapper';

describe('materials › celsius-grid', () => {
  it('returns °C values with both ends included', () => {
    expect(toCelsiusGrid(800, 1000, 100, 40)).toEqual([800, 900, 1000]);
  });

  it('appends the end for an uneven step', () => {
    expect(toCelsiusGrid(0, 25, 10, 40)).toEqual([0, 10, 20, 25]);
  });

  it('rejects missing values and too many points', () => {
    expect(() => toCelsiusGrid(null, 100, 10, 40)).toThrow('Enter from, to and step.');
    expect(() => toCelsiusGrid(0, 100, 1, 10)).toThrow('The range gives 101 points; the limit is 10. Increase the step.');
  });
});
