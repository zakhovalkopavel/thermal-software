import type { DimensionlessResult } from './dimensionless-result.type';

export type VelocitySweepPoint = {
  w_m_s: number;
  result?: DimensionlessResult;
  error?: Error;
};
