import { MenuItem, TextField } from '@mui/material';

type EnumSelectProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  helperText?: string;
};

export function EnumSelect<T extends string>({ label, value, options, onChange, disabled, helperText }: EnumSelectProps<T>) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      disabled={disabled}
      helperText={helperText}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
