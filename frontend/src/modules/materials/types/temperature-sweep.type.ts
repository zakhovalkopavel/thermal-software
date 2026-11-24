export type TemperatureSweep = {
  mode: 'single' | 'range';
  unit: 'C' | 'K';
  value: number | null;
  from: number | null;
  to: number | null;
  step: number | null;
};
