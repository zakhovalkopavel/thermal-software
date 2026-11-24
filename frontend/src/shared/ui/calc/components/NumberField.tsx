import { InputAdornment, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

type NumberFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number | 'any';
};

export function NumberField({ value, onChange, unit, min, max, step = 'any', slotProps, ...rest }: NumberFieldProps) {
  return (
    <TextField
      {...rest}
      type="number"
      size={rest.size ?? 'small'}
      fullWidth={rest.fullWidth ?? true}
      value={value ?? ''}
      onChange={(event) => {
        const next = (event.target as HTMLInputElement).valueAsNumber;
        onChange(Number.isNaN(next) ? null : next);
      }}
      slotProps={{
        ...slotProps,
        htmlInput: { min, max, step },
        input: unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined,
      }}
    />
  );
}
