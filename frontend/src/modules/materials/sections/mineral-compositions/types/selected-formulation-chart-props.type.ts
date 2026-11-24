import type { BlendResult } from './blend-result.type';

export type SelectedFormulationChartProps = {
  labels: string[];
  /** Current mass % per requested fraction, same order as `labels`. */
  current: number[];
  selected: BlendResult;
};
