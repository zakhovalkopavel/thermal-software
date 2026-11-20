export type MetalPropertiesRequest = {
  mode: 'single' | 'range';
  materials: string[];
  temperatures_K: number[];
  /** Display unit for the T axis / table (API values stay in K). */
  unit: 'C' | 'K';
};
