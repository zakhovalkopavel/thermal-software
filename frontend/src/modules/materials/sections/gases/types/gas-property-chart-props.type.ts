import type { GasPropertyKey } from './gas-property-key.type';

export type GasPropertyChartProps = {
  groups: Array<{ name: string; rows: Array<{ T_K: number } & Partial<Record<GasPropertyKey, number>>> }>;
  availableKeys: GasPropertyKey[];
};
