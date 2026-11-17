import { describe, expect, it } from 'vitest';
import { applyGasTemperatureBounds } from './apply-gas-temperature-bounds.mapper';
import type { TemperatureSweep } from '../types/temperature-sweep.type';

describe('applyGasTemperatureBounds', () => {
  it('raises single-T below Tb(P) up to the boiling point', () => {
    const sweep: TemperatureSweep = {
      mode: 'single',
      unit: 'K',
      value: 250,
      from: null,
      to: null,
      step: null,
    };
    expect(applyGasTemperatureBounds(sweep, { Tmin_K: 373.15, Tmax_K: 5000 }).value).toBe(373.15);
  });

  it('clamps a range start above Tb and below Tmax', () => {
    const sweep: TemperatureSweep = {
      mode: 'range',
      unit: 'K',
      value: null,
      from: 200,
      to: 6000,
      step: 50,
    };
    const next = applyGasTemperatureBounds(sweep, { Tmin_K: 373.15, Tmax_K: 1500 });
    expect(next.from).toBe(373.15);
    expect(next.to).toBe(1500);
  });
});
