import type { AverageSweepPoint } from './average-sweep-point.type';
import type { ThermalRequest } from './thermal-request.type';

export type AverageTemperatureChartProps = {
  request: ThermalRequest;
  points: AverageSweepPoint[];
};
