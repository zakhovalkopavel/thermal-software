import { Autocomplete, Box, TextField, Typography, createFilterOptions } from '@mui/material';
import { useMaterialPickerOptions } from '../hooks/useMaterialPickerOptions';
import type { MaterialPickerOption } from '../types/material-picker-option.type';
import type { MaterialPickerProps } from '../types/material-picker-props.type';

const filterOptions = createFilterOptions<MaterialPickerOption>({
  stringify: (option) => `${option.label} ${option.id} ${option.groupLabel}`,
});

export function MaterialPicker({
  kinds,
  categories,
  excludeIds = [],
  value,
  onChange,
  label = 'Material',
  size = 'small',
  disabled,
}: MaterialPickerProps) {
  const { options, isLoading, error } = useMaterialPickerOptions(kinds, categories);
  const visible = options.filter(
    (option) => !excludeIds.includes(option.id) || (value && option.id === value.materialId && option.kind === value.kind),
  );
  const selected = value
    ? (options.find((option) => option.kind === value.kind && option.id === value.materialId) ?? null)
    : null;

  return (
    <Autocomplete
      size={size}
      options={visible}
      value={selected}
      loading={isLoading}
      disabled={disabled}
      groupBy={(option) => option.groupLabel}
      getOptionLabel={(option) => option.label}
      filterOptions={filterOptions}
      isOptionEqualToValue={(option, current) => option.kind === current.kind && option.id === current.id}
      onChange={(_, option) => onChange(option ? { kind: option.kind, materialId: option.id } : null)}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={`${option.kind}:${option.id}`} {...props}>
          <Box>
            <Typography variant="body2">{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.id}
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(error)}
          helperText={error ? 'Catalogue could not be loaded' : undefined}
        />
      )}
    />
  );
}
