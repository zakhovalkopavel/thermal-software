import { CorrelationName } from '../types/correlation-name.type';
import { FlowRegime } from '../types/flow-regime.type';

export interface NusseltResult {
  Nu: number;
  h_W_m2K?: number;
  correlation: CorrelationName;
  regime: FlowRegime;
  isNatural: boolean;
  preferredRequested?: CorrelationName;
  preferredUsed: boolean;
  preferredRejectedReason?: string;
  warning?: string;
  rangeValid: boolean;
  allCorrelations?: Record<string, { Nu: number; rangeValid: boolean; warning?: string }>;
}

