import { Checkbox, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material';
import { GLASS_REFERENCES } from './constants/glass-references.constants';
import type { GlassCompareSelectProps } from './types/glass-compare-select-props.type';

export function GlassCompareSelect({ references, selected, onChange, duplicateId }: GlassCompareSelectProps) {
  const toggle = (materialId: string) =>
    onChange(selected.includes(materialId) ? selected.filter((id) => id !== materialId) : [...selected, materialId]);

  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2">
        Compare with ({GLASS_REFERENCES.min}–{GLASS_REFERENCES.max})
      </Typography>
      <FormGroup>
        {references.map((reference) => {
          const checked = selected.includes(reference.materialId);
          return (
            <FormControlLabel
              key={reference.materialId}
              control={
                <Checkbox
                  size="small"
                  checked={checked}
                  onChange={() => toggle(reference.materialId)}
                  disabled={
                    (checked && selected.length <= GLASS_REFERENCES.min) || (!checked && selected.length >= GLASS_REFERENCES.max)
                  }
                />
              }
              label={
                <Typography variant="body2">
                  {reference.name}
                  {reference.materialId === duplicateId && (
                    <Typography component="span" variant="caption" color="text.secondary">
                      {' '}
                      — same as your glass, not plotted twice
                    </Typography>
                  )}
                </Typography>
              }
            />
          );
        })}
      </FormGroup>
    </Stack>
  );
}
