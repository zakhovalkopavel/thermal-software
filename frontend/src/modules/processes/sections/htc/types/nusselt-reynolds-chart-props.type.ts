import type { CorrelationInfo } from './correlation-info.type';
import type { VelocitySweepPoint } from './velocity-sweep-point.type';

export type NusseltReynoldsChartProps = {
  points: VelocitySweepPoint[];
  correlation: CorrelationInfo | undefined;
};
