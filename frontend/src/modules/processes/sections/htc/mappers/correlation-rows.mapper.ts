import type { CorrelationRow } from '../types/correlation-row.type';
import type { DimensionlessResult } from '../types/dimensionless-result.type';

export function toCorrelationRows(result: DimensionlessResult): CorrelationRow[] {
  const hPerNu = result.Nu > 0 ? result.h_W_m2K / result.Nu : 0;
  return Object.entries(result.allCorrelations ?? {}).map(([name, comparison]) => ({
    name,
    Nu: comparison.Nu,
    h_W_m2K: comparison.Nu * hPerNu,
    rangeValid: comparison.rangeValid,
    warning: comparison.warning,
    used: name === result.correlation,
  }));
}
