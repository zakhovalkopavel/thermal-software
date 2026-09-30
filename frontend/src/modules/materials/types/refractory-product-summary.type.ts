import type { TemperatureRange } from './temperature-range.type';

export type RefractoryProductSummary = {
  materialId: string;
  name: string;
  description: string;
  emissivityRange_K: TemperatureRange;
};
