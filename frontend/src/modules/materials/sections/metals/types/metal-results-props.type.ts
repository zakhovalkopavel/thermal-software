import type { MetalSummary } from '../../../types/metal-summary.type';
import type { MetalPropertiesRequest } from './metal-properties-request.type';
import type { MetalThermalResult } from './metal-thermal-result.type';

export type MetalResultsProps = {
  request: MetalPropertiesRequest;
  metals: MetalSummary[];
  byMaterial: Record<string, MetalThermalResult[]>;
};
