import { Alert, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { GLASS_OXIDES, OxideCompositionInput } from '@/shared/ui/calc';
import { GLASS_MODELS } from './constants/glass-models.constants';
import { GLASSES_UI } from './constants/glasses-ui.constants';
import type { GlassCompositionFormProps } from './types/glass-composition-form-props.type';
import type { GlassModel } from './types/glass-model.type';

const AUTO_MODEL = 'auto';

export function GlassCompositionForm({
  presets,
  presetId,
  onPresetChange,
  ignoredKeys,
  composition,
  onCompositionChange,
  unit,
  onUnitChange,
  model,
  onModelChange,
}: GlassCompositionFormProps) {
  return (
    <Stack spacing={2}>
      <TextField select size="small" label="Start from" value={presetId} onChange={(event) => onPresetChange(event.target.value)}>
        <MenuItem value={GLASSES_UI.customPresetId}>Custom</MenuItem>
        {presets.map((preset) => (
          <MenuItem key={preset.materialId} value={preset.materialId}>
            {preset.name}
          </MenuItem>
        ))}
      </TextField>
      {ignoredKeys.length > 0 && (
        <Alert severity="info">Not glass oxides, left out of the preset: {ignoredKeys.join(', ')}</Alert>
      )}
      <Typography variant="subtitle2">Oxide composition</Typography>
      <OxideCompositionInput
        value={composition}
        onChange={onCompositionChange}
        unit={unit}
        onUnitChange={onUnitChange}
        allowedOxides={GLASS_OXIDES}
      />
      <TextField
        select
        size="small"
        label="Model"
        value={model ?? AUTO_MODEL}
        onChange={(event) => onModelChange(event.target.value === AUTO_MODEL ? null : (event.target.value as GlassModel))}
        helperText="Auto lets the backend choose; an out-of-range model is substituted."
      >
        <MenuItem value={AUTO_MODEL}>Auto</MenuItem>
        {GLASS_MODELS.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
