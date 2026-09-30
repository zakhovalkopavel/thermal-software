import type { ThermalConductivityResult } from '../../../types/thermal-conductivity-result.type';

export type ConductivitySweepChartProps = {
  points: { temperature: number; porosity: number; result?: ThermalConductivityResult }[];
  porosity: number;
};
