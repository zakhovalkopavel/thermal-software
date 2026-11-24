import type { TemperatureSweep } from './temperature-sweep.type';

export type TemperatureSweepFieldsProps = {
  value: TemperatureSweep;
  onChange: (next: TemperatureSweep) => void;
  maxPoints?: number;
  allowUnitChange?: boolean;
};
