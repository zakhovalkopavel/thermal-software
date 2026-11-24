import { GAS_CHART_PROPERTY_KEYS } from '../constants/gas-property-axes.constants';
import type { GasPropertyKey } from '../types/gas-property-key.type';

/** Chart-order keys that appear with a defined numeric value in at least one row. */
export function gasChartPresentKeys(
  rows: Array<Partial<Record<GasPropertyKey, number>>>,
): GasPropertyKey[] {
  return GAS_CHART_PROPERTY_KEYS.filter((key) => rows.some((row) => row[key] !== undefined));
}
