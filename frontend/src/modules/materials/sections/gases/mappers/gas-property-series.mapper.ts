import type { XYSeries } from '../../../../../components/charts';
import type { GasPropertyKey } from '../types/gas-property-key.type';

type PropertyRow = { T_K: number } & Partial<Record<GasPropertyKey, number>>;

/** One series per named row group for the selected property; rows without the value are skipped. */
export function toGasPropertySeries(groups: Array<{ name: string; rows: PropertyRow[] }>, key: GasPropertyKey): XYSeries[] {
  return groups
    .map((group) => ({
      name: group.name,
      data: group.rows
        .filter((row) => row[key] !== undefined)
        .sort((a, b) => a.T_K - b.T_K)
        .map((row) => [row.T_K, row[key] as number] as [number, number]),
    }))
    .filter((series) => series.data.length > 0);
}
