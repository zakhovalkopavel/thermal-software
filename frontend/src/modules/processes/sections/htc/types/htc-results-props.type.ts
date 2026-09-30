import type { CorrelationInfo } from './correlation-info.type';
import type { DimensionlessInput } from './dimensionless-input.type';
import type { DimensionlessResult } from './dimensionless-result.type';

export type HtcResultsProps = {
  input: DimensionlessInput;
  result: DimensionlessResult;
  correlations: CorrelationInfo[];
};
