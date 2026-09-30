import type { MetalSummary } from '../../../types/metal-summary.type';
import type { MetalThermalResult } from './metal-thermal-result.type';

export type MetalPropertiesChartProps = {
  metals: MetalSummary[];
  byMaterial: Record<string, MetalThermalResult[]>;
};
