import { describe, expect, it } from 'vitest';
import { celsiusToKelvin } from './celsius-to-kelvin';

describe('processes › celsius-to-kelvin', () => {
  it('adds the Kelvin offset', () => {
    expect(celsiusToKelvin(0)).toBe(273.15);
    expect(celsiusToKelvin(-273.15)).toBe(0);
    expect(celsiusToKelvin(1000)).toBeCloseTo(1273.15, 10);
  });
});
