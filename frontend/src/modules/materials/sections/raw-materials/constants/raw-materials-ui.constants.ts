import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export const RAW_MATERIALS_UI = {
  maxCompared: 3,
  defaultPorosity: 0.2,
  porosityMin: 0,
  porosityMax: 1,
  porosityStep: 0.05,
  densePorosity: 0,
  defaultSweep: { mode: 'range', unit: 'C', value: 1000, from: 20, to: 1400, step: 50 } satisfies TemperatureSweep,
  modelDensityNote: 'ρ = 2500 · (1 − P)',
  temperatureDecimals: 6,
  coverageDigits: 3,
  listMaxHeight: 560,
} as const;
