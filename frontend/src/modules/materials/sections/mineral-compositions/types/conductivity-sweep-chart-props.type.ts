import type { MixThermalResult } from '../../../types/mix-thermal-result.type';

export type ConductivitySweepChartProps = {
  results: MixThermalResult[];
  porosity: number;
};
