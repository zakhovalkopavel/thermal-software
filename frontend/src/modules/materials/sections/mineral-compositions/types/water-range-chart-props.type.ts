import type { WaterDemandRangeResult } from './water-demand-range-result.type';
import type { Workability } from './workability.type';

export type WaterRangeChartProps = {
  range: WaterDemandRangeResult;
  demand_pct?: number;
  workability: Workability;
};
