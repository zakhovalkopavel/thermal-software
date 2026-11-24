export type ScatterSeries = {
  name: string;
  color?: string;
  data: Array<{ id: string; x: number; y: number; z?: number; label?: string }>;
};
