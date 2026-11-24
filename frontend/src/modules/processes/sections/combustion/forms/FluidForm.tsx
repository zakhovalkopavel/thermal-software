import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { GasCompositionInput } from '@/shared/ui/calc';
import { NumberFieldGrid } from '../../../components/NumberFieldGrid';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { FluidDraft } from '../types/fluid-draft.type';
import type { FluidFieldKey } from '../types/fluid-field-key.type';
import type { FluidFormProps } from '../types/fluid-form-props.type';
import { AdvancedFields } from '../../../components/AdvancedFields';
import { CondensedFuelFields } from './CondensedFuelFields';
import { SupplyFields } from './SupplyFields';

const NO_PRESETS: FluidFormProps['presets'] = [];

export function FluidForm({ value, onChange, presets, gasSpecies }: FluidFormProps) {
  const setValue = (key: FluidFieldKey, next: number | null) => onChange({ ...value, values: { ...value.values, [key]: next } });
  const gasSource = presets.length > 0 ? value.gasSource : 'custom';
  const presetId = value.gasFuelId ?? presets[0]?.id ?? '';

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={value.phase}
        onChange={(_, phase: FluidDraft['phase'] | null) => phase && onChange({ ...value, phase })}
      >
        <ToggleButton value="gas">Gaseous fuel</ToggleButton>
        <ToggleButton value="liquid">Liquid fuel</ToggleButton>
      </ToggleButtonGroup>

      {value.phase === 'gas' ? (
        <Stack spacing={2}>
          {presets.length > 0 && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={gasSource}
              onChange={(_, next: FluidDraft['gasSource'] | null) => next && onChange({ ...value, gasSource: next })}
            >
              <ToggleButton value="preset">Preset</ToggleButton>
              <ToggleButton value="custom">Mole fractions</ToggleButton>
            </ToggleButtonGroup>
          )}
          {gasSource === 'preset' ? (
            <TextField select size="small" fullWidth label="Gas" value={presetId} onChange={(event) => onChange({ ...value, gasFuelId: event.target.value })}>
              {presets.map((fuel) => (
                <MenuItem key={fuel.id} value={fuel.id}>
                  {fuel.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <GasCompositionInput value={value.fuelGas} onChange={(fuelGas) => onChange({ ...value, fuelGas })} species={gasSpecies} />
          )}
        </Stack>
      ) : (
        <CondensedFuelFields value={value.liquidFuel} onChange={(liquidFuel) => onChange({ ...value, liquidFuel })} presets={NO_PRESETS} />
      )}

      <SupplyFields value={value.supply} onChange={(supply) => onChange({ ...value, supply })} />
      <NumberFieldGrid fields={COMBUSTION_FIELDS.fluid.main} values={value.values} onChange={setValue} />
      <AdvancedFields>
        <NumberFieldGrid fields={COMBUSTION_FIELDS.fluid.advanced} values={value.values} onChange={setValue} />
      </AdvancedFields>
    </Stack>
  );
}
