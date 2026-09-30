export type RefractoryPropertiesRequest = {
  mode: 'single' | 'range';
  materials: string[];
  temperatures_K: number[];
};
