import type { BlendBestBy } from './blend-best-by.type';
import type { BlendResult } from './blend-result.type';

export type BlendResultMapChartProps = {
  results: BlendResult[];
  bestBy: BlendBestBy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};
