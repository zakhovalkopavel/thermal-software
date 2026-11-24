import type { CompositionUnit } from '@/shared/ui/calc';

export type CompositionCompareChartProps = {
  glasses: { name: string; composition: Record<string, number> }[];
  unit: CompositionUnit;
};
