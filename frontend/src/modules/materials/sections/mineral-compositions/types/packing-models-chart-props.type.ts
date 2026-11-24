import type { PackingModel } from './packing-model.type';
import type { PackingResult } from './packing-result.type';

export type PackingModelsChartProps = {
  results: Partial<Record<PackingModel, PackingResult>>;
};
