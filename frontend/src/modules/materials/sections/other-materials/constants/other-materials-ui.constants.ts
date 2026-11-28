import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export const OTHER_MATERIALS_UI = {
  defaultPressure_Pa: 101_325,
  defaultSweep: { mode: 'range', unit: 'K', value: 800, from: 300, to: 1500, step: 100 } satisfies TemperatureSweep,
  param: 'compound',
} as const;
