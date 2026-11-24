import type { CorrelationRange } from './correlation-range.type';

export type CorrelationInfo = {
  name: string;
  geometry: string[];
  Re?: CorrelationRange;
  Pr?: CorrelationRange;
  Ra?: CorrelationRange;
};
