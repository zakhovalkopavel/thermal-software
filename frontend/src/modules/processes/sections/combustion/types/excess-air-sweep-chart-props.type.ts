import type { ExcessAirSweepPoint } from './excess-air-sweep-point.type';

export type ExcessAirSweepChartProps = {
  points: ExcessAirSweepPoint[];
  /** Excess air of the current calculation. */
  kExcessAir?: number;
};
