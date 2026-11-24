import type { CorrelationInfo } from './correlation-info.type';
import type { VelocitySweepPoint } from './velocity-sweep-point.type';

export type HtcVelocityChartProps = {
  points: VelocitySweepPoint[];
  correlation: CorrelationInfo | undefined;
};
