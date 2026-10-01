import { Stack, Typography } from '@mui/material';
import { ResultTable, formatValue } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { MaterialCompositionPieChart } from './charts/MaterialCompositionPieChart';
import type { MaterialCompositionProps } from './types/material-composition-props.type';

type CompositionRow = { key: string; value: number };

const COLUMNS: ResultTableColumn<CompositionRow>[] = [
  { key: 'key', label: 'Component', align: 'left' },
  { key: 'value', label: 'Content', unit: 'wt%' },
];

export function MaterialCompositionCard({ composition }: MaterialCompositionProps) {
  const rows = Object.entries(composition)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (rows.length === 0) {
    return <Typography color="text.secondary">No composition stored for this material.</Typography>;
  }
  return (
    <Stack spacing={1}>
      <MaterialCompositionPieChart composition={composition} />
      <ResultTable columns={COLUMNS} rows={rows} rowKey={(row) => row.key} />
      <Typography variant="caption" color="text.secondary">
        Σ = {formatValue(total)} wt% (as stored, loss-on-ignition keys included)
      </Typography>
    </Stack>
  );
}
