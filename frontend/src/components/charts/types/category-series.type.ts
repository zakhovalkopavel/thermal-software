export type CategorySeries = {
  name: string;
  data: Array<number | null | { y: number | null; color?: string }>;
  color?: string;
  stack?: string;
  dashStyle?: 'Solid' | 'Dash';
  type?: 'column' | 'line' | 'scatter';
};
