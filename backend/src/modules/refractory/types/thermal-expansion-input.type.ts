import type { ThermalInput } from './thermal-input.type';

/** Thermal expansion calculation input. */
export type ThermalExpansionInput = ThermalInput & {
  /** Reference temperature (°C, default 20) */
  referenceTemperature?: number;

  /** Temperature range for calculation (°C) */
  temperatureRange?: { min: number; max: number };

  /** Expansion model type */
  model?: 'linear' | 'polynomial' | 'exponential';
};
