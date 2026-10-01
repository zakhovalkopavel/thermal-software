import { Alert, Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { COMPOSITION_INPUT, CalculateButton, EnumSelect, GasCompositionInput, NumberField } from '@/shared/ui/calc';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import { GAS_MIXTURE_PRESETS } from './constants/gas-mixture-presets.constants';
import type { GasMixtureFormProps } from './types/gas-mixture-form-props.type';

const CUSTOM_PRESET = 'custom';

export function GasMixtureForm({
  species,
  composition,
  onCompositionChange,
  fractionType,
  onFractionTypeChange,
  sweep,
  onSweepChange,
  pressure_atm,
  onPressureChange,
  onCalculate,
  loading,
  formError,
}: GasMixtureFormProps) {
  const sum = Object.values(composition).reduce((total, value) => total + value, 0);
  const sumOk = Math.abs(sum - COMPOSITION_INPUT.fractionTotal) <= COMPOSITION_INPUT.fractionSumTolerance;
  const activePreset =
    GAS_MIXTURE_PRESETS.find((preset) => JSON.stringify(preset.composition) === JSON.stringify(composition))?.key ??
    CUSTOM_PRESET;

  return (
    <Stack
      spacing={2}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <EnumSelect
        label="Start from"
        value={activePreset}
        options={[
          { value: CUSTOM_PRESET, label: 'Custom' },
          ...GAS_MIXTURE_PRESETS.map((preset) => ({ value: preset.key, label: preset.label })),
        ]}
        onChange={(key) => {
          const preset = GAS_MIXTURE_PRESETS.find((item) => item.key === key);
          if (preset) onCompositionChange({ ...preset.composition });
        }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">Composition</Typography>
        <ToggleButtonGroup size="small" exclusive value={fractionType} onChange={(_, next) => next && onFractionTypeChange(next)}>
          <ToggleButton value="mole">Mole</ToggleButton>
          <ToggleButton value="mass">Mass</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <GasCompositionInput
        value={composition}
        onChange={onCompositionChange}
        species={species}
        fractionLabel={`${fractionType} fraction`}
      />
      <Typography variant="subtitle2">Conditions</Typography>
      <TemperatureSweepFields value={sweep} onChange={onSweepChange} />
      <NumberField label="Pressure" unit="atm" value={pressure_atm} min={0.1} max={300} onChange={onPressureChange} />
      {!sumOk && <Alert severity="warning">The fractions must sum to 1 — use Normalize.</Alert>}
      {formError && <Alert severity="warning">{formError}</Alert>}
      <Box>
        <CalculateButton loading={loading} disabled={!sumOk} />
      </Box>
    </Stack>
  );
}
