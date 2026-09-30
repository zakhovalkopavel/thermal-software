import type { CompositionUnit } from '../../../../../components/calc';

export type CompositionCompareChartProps = {
  glasses: { name: string; composition: Record<string, number> }[];
  unit: CompositionUnit;
};
