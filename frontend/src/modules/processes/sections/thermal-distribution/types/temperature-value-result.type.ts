import type { ThermalCriteria } from './thermal-criteria.type';

/** Response of temperature/at-depth and temperature/average. */
export type TemperatureValueResult = {
  temperature: number;
  criteria: ThermalCriteria;
};
