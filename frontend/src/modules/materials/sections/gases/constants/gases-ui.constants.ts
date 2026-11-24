import type { TemperatureSweep } from '../../../types/temperature-sweep.type';

export const GASES_UI = {
  maxCompared: 3,
  defaultSweep: { mode: 'range', unit: 'K', value: 800, from: 300, to: 1500, step: 50 } satisfies TemperatureSweep,
  defaultPressure_Pa: 101325,
  defaultPressure_atm: 1,
  cpComparisonDefault_K: 1000,
  excludedPickerIds: ['gas_mix'],
} as const;
