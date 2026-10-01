import { describe, expect, it } from 'vitest';
import { toTemperatureGrid } from './temperature-grid.mapper';

const RANGE = { mode: 'range', unit: 'C', value: null, from: 20, to: 120, step: 50 } as const;

describe('materials › temperature-grid', () => {
  it('converts a single °C value to K', () => {
    expect(toTemperatureGrid({ ...RANGE, mode: 'single', value: 500 })).toEqual([773.15]);
  });

  it('keeps a single K value', () => {
    expect(toTemperatureGrid({ ...RANGE, mode: 'single', unit: 'K', value: 600 })).toEqual([600]);
  });

  it('includes both ends of a °C range', () => {
    expect(toTemperatureGrid(RANGE)).toEqual([293.15, 343.15, 393.15]);
  });

  it('appends the end when the step does not divide the range', () => {
    expect(toTemperatureGrid({ ...RANGE, unit: 'K', from: 300, to: 400, step: 40 })).toEqual([300, 340, 380, 400]);
  });

  it('avoids floating-point drift with fractional steps', () => {
    expect(toTemperatureGrid({ ...RANGE, unit: 'K', from: 0.1, to: 0.3, step: 0.1 })).toEqual([0.1, 0.2, 0.3]);
  });

  it('rejects invalid sweeps with a user-facing message', () => {
    expect(() => toTemperatureGrid({ ...RANGE, mode: 'single' })).toThrow('Enter a temperature.');
    expect(() => toTemperatureGrid({ ...RANGE, step: null })).toThrow('Enter from, to and step.');
    expect(() => toTemperatureGrid({ ...RANGE, step: 0 })).toThrow('Step must be positive.');
    expect(() => toTemperatureGrid({ ...RANGE, from: 200, to: 100 })).toThrow('"To" must not be below "from".');
    expect(() => toTemperatureGrid({ ...RANGE, from: 0, to: 1000, step: 1 }, 40)).toThrow(
      'The range gives 1001 points; the limit is 40. Increase the step.',
    );
  });
});
