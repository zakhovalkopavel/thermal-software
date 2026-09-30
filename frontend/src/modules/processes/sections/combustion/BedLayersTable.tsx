import { ResultTable, formatValue } from '../../../../components/calc';
import type { ResultTableColumn } from '../../../../components/calc';
import type { BedLayerResult } from '../../types/bed-layer-result.type';
import type { BedLayersTableProps } from './types/bed-layers-table-props.type';

const PERCENT = 100;
const fraction = (species: string) => (layer: BedLayerResult) => formatValue((layer.moleFractions[species] ?? 0) * PERCENT);

const COLUMNS: ResultTableColumn<BedLayerResult>[] = [
  { key: 'index', label: '#', align: 'left' },
  { key: 'z_m', label: 'z', unit: 'm' },
  { key: 'tGas_K', label: 'T gas', unit: 'K' },
  { key: 'tSolid_K', label: 'T solid', unit: 'K' },
  { key: 'O2', label: 'O₂', unit: '%', render: fraction('O2') },
  { key: 'CO2', label: 'CO₂', unit: '%', render: fraction('CO2') },
  { key: 'CO', label: 'CO', unit: '%', render: fraction('CO') },
  { key: 'fuelBurnRate_kgs', label: 'Fuel burn rate', unit: 'kg/s' },
  { key: 'wallLoss_W', label: 'Wall loss', unit: 'W' },
  { key: 'velocity_ms', label: 'Velocity', unit: 'm/s' },
  { key: 'steamInjected', label: 'Steam', align: 'center', render: (layer) => (layer.steamInjected ? '✓' : '') },
];

export function BedLayersTable({ layers }: BedLayersTableProps) {
  return <ResultTable columns={COLUMNS} rows={layers} rowKey={(layer) => String(layer.index)} />;
}
