export type ChartAxis = {
  title: string;
  unit?: string;
  type?: 'linear' | 'logarithmic';
  min?: number;
  max?: number;
  opposite?: boolean;
};
