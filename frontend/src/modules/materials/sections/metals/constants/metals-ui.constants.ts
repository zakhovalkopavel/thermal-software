import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export const METALS_UI = {
  maxCompared: 2,
  defaultSweep: { mode: 'range', unit: 'K', value: 800, from: 300, to: 1500, step: 50 } satisfies TemperatureSweep,
} as const;
