import type { ThermalRequest } from './thermal-request.type';
import type { TimedProfile } from './timed-profile.type';

export type TemperatureProfileChartProps = {
  title: string;
  request: ThermalRequest;
  depths: number[];
  profiles: TimedProfile[];
};
