import type { CorrelationComparison } from './correlation-comparison.type';

export type DimensionlessResult = {
  Re: number;
  Pr: number;
  Gr: number;
  Ra: number;
  Nu: number;
  h_W_m2K: number;
  correlation: string;
  regime: string;
  isNatural: boolean;
  preferredRequested?: string;
  preferredUsed?: boolean;
  preferredRejectedReason?: string;
  rangeValid: boolean;
  warning?: string;
  /** Present when `compareAll` was requested. */
  allCorrelations?: Record<string, CorrelationComparison>;
};
