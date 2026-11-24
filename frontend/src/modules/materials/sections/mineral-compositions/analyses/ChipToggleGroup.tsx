import { Box, Chip, Stack, Typography } from '@mui/material';
import type { ChipToggleGroupProps } from '../types/chip-toggle-group-props.type';

export function ChipToggleGroup<T extends string | number>({ label, options, selected, onChange }: ChipToggleGroupProps<T>) {
  const toggle = (value: T) => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {options.map((option) => {
          const isOn = selected.includes(option.value);
          return (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              color={isOn ? 'primary' : 'default'}
              variant={isOn ? 'filled' : 'outlined'}
              onClick={() => toggle(option.value)}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
