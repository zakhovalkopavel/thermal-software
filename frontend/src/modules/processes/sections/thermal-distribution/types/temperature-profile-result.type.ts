import type { ThermalCriteria } from './thermal-criteria.type';

export type TemperatureProfileResult = {
  temperatures: number[];
  criteria: ThermalCriteria;
};
