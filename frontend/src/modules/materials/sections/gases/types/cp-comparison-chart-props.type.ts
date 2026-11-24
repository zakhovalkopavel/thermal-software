import type { CpComparisonEntry } from './cp-comparison-entry.type';

export type CpComparisonChartProps = {
  species: string;
  T_K: number;
  entries: CpComparisonEntry[];
};
