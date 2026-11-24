import { describe, expect, it } from 'vitest';
import { kelvinToCelsius } from './kelvin-to-celsius';

describe('processes › kelvin-to-celsius', () => {
  it('subtracts the Kelvin offset', () => {
    expect(kelvinToCelsius(273.15)).toBe(0);
    expect(kelvinToCelsius(0)).toBe(-273.15);
    expect(kelvinToCelsius(1273.15)).toBeCloseTo(1000, 10);
  });
});
