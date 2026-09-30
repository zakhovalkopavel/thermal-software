import { Grid } from '@mui/material';
import { NumberField } from '../../../components/calc';
import type { NumberFieldGridProps } from '../types/number-field-grid-props.type';

const GRID_COLUMNS = 12;

export function NumberFieldGrid<K extends string>({ fields, values, onChange, columns = 2 }: NumberFieldGridProps<K>) {
  return (
    <Grid container spacing={2}>
      {fields.map((field) => (
        <Grid key={field.key} size={{ xs: GRID_COLUMNS / 2, md: GRID_COLUMNS / columns }}>
          <NumberField
            label={field.label}
            unit={field.unit}
            value={values[field.key]}
            onChange={(value) => onChange(field.key, value)}
            min={field.min}
            max={field.max}
            required={field.required}
            helperText={field.helperText}
          />
        </Grid>
      ))}
    </Grid>
  );
}
