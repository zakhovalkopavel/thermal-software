import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export const REFRACTORIES_UI = {
  maxCompared: 4,
  defaultSweep: { mode: 'range', unit: 'C', value: 1000, from: 20, to: 1400, step: 50 } satisfies TemperatureSweep,
  shadeStep: 0.25,
  rankingChart: { baseHeight: 80, rowHeight: 50 },
} as const;
