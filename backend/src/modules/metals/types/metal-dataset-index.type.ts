import type { MetalDatasetIndexEntry } from './metal-dataset-index-entry.type';

export type MetalDatasetIndex = {
  materials: Record<string, MetalDatasetIndexEntry>;
  byGroup: Record<string, string[]>;
  byFamily: Record<string, string[]>;
};
