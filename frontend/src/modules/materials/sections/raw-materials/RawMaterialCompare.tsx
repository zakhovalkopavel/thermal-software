import { Stack, Typography } from '@mui/material';
import { ResultTable, formatValue } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { ReferenceComparisonChart } from './charts/ReferenceComparisonChart';
import { REFERENCE_PROPERTY_FIELDS } from './constants/reference-property-fields.constants';
import type { RawMaterialCompareProps } from './types/raw-material-compare-props.type';
import type { ReferencePropertyField } from './types/reference-property-field.type';

export function RawMaterialCompare({ materials }: RawMaterialCompareProps) {
  const rows = REFERENCE_PROPERTY_FIELDS.filter((field) => materials.some((entry) => field.read(entry) != null));
  const columns: ResultTableColumn<ReferencePropertyField>[] = [
    { key: 'label', label: 'Property', align: 'left', render: (field) => (field.unit ? `${field.label}, ${field.unit}` : field.label) },
    ...materials.map((entry) => ({
      key: entry.materialId,
      label: entry.name,
      render: (field: ReferencePropertyField) => formatValue(field.read(entry), field.digits),
    })),
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Compare reference values</Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">The compared materials have no reference values.</Typography>
      ) : (
        <>
          <ResultTable columns={columns} rows={rows} rowKey={(field) => field.key} />
          <ReferenceComparisonChart materials={materials} />
        </>
      )}
    </Stack>
  );
}
