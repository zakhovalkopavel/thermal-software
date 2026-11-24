import { useMemo, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { CategoryBarChart } from '@/shared/ui/charts';
import { REFERENCE_PROPERTY_FIELDS } from '../constants/reference-property-fields.constants';
import type { ReferenceComparisonProps } from '../types/reference-comparison-props.type';
import type { ReferencePropertyKey } from '../types/reference-property-key.type';

export function ReferenceComparisonChart({ materials }: ReferenceComparisonProps) {
  const fields = useMemo(
    () => REFERENCE_PROPERTY_FIELDS.filter((field) => materials.some((entry) => field.read(entry) != null)),
    [materials],
  );
  const [selectedKey, setSelectedKey] = useState<ReferencePropertyKey | null>(null);
  const field = fields.find((item) => item.key === selectedKey) ?? fields[0];
  if (!field) return null;

  return (
    <CategoryBarChart
      title={`Reference ${field.label}`}
      actions={
        <TextField
          select
          size="small"
          label="Property"
          value={field.key}
          onChange={(event) => setSelectedKey(event.target.value as ReferencePropertyKey)}
          sx={{ minWidth: 180 }}
        >
          {fields.map((item) => (
            <MenuItem key={item.key} value={item.key}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
      }
      categories={materials.map((entry) => entry.name)}
      series={[{ name: field.label, data: materials.map((entry) => field.read(entry) ?? null) }]}
      yAxis={{ title: field.label, unit: field.unit }}
    />
  );
}
