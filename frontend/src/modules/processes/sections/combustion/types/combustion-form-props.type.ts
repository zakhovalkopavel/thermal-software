import type { FuelSummary } from '../../../types/fuel-summary.type';

export type CombustionFormProps<D> = {
  value: D;
  onChange: (next: D) => void;
  presets: FuelSummary[];
};
