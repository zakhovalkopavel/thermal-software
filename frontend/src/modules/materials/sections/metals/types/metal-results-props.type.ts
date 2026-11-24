import type { MetalSummary } from '../../../types/metal-summary.type';
import type { MetalPropertiesRequest } from './metal-properties-request.type';
import type { MetalThermalResult } from './metal-thermal-result.type';

export type MetalResultsProps = {
  request: MetalPropertiesRequest;
  metals: MetalSummary[];
  byMaterial: Record<string, MetalThermalResult[]>;
  /** Live form unit — plot/table T axis follows this without recalculating. */
  temperatureUnit: 'C' | 'K';
  /** Points skipped client-side when a legacy API still 400s on out-of-domain T. */
  skippedOutsideDomain?: number;
};
