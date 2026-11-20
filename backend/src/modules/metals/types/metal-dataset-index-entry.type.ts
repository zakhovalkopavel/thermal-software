export type MetalDatasetIndexEntry = {
  path: string;
  name: string;
  group: string;
  family: string | null;
  availableProperties: string[];
  approximatedProperties?: string[];
  hasDonorFill: boolean;
  compositionElements: string[];
};
