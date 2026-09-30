export type MetalPropertiesRequest = {
  mode: 'single' | 'range';
  materials: string[];
  temperatures_K: number[];
};
