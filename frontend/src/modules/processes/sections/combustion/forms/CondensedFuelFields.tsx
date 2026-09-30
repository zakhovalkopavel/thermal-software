import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { NumberField, formatValue } from '../../../../../components/calc';
import { NumberFieldGrid } from '../../../components/NumberFieldGrid';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import { COMBUSTION_UI } from '../constants/combustion-ui.constants';
import type { CondensedFuelDraft } from '../types/condensed-fuel-draft.type';
import type { CondensedFuelFieldsProps } from '../types/condensed-fuel-fields-props.type';

export function CondensedFuelFields({ value, onChange, presets, withBed = false }: CondensedFuelFieldsProps) {
  const canUsePreset = presets.length > 0;
  const source = canUsePreset ? value.source : 'custom';
  const presetId = value.fuelId ?? presets[0]?.id ?? '';
  const preset = presets.find((fuel) => fuel.id === presetId);
  const elementalSum = Object.values(value.elemental).reduce<number>((total, fraction) => total + (fraction ?? 0), 0);
  const sumOff = Math.abs(elementalSum - 1) > COMBUSTION_UI.elementalSumTolerance;
  const setProperty = (key: keyof CondensedFuelDraft['properties'], next: number | null) =>
    onChange({ ...value, properties: { ...value.properties, [key]: next } });

  return (
    <Stack spacing={2}>
      {canUsePreset && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={source}
          onChange={(_, next: CondensedFuelDraft['source'] | null) => next && onChange({ ...value, source: next })}
        >
          <ToggleButton value="preset">Preset</ToggleButton>
          <ToggleButton value="custom">Custom fuel</ToggleButton>
        </ToggleButtonGroup>
      )}

      {source === 'preset' ? (
        <TextField
          select
          size="small"
          fullWidth
          label="Fuel"
          value={presetId}
          onChange={(event) => onChange({ ...value, fuelId: event.target.value })}
          helperText={
            preset
              ? `LHV ${formatValue(preset.lhv_Jkg / COMBUSTION_UI.joulesPerMegajoule)} MJ/kg · stoichiometric air ${formatValue(preset.stoichAir_kgkg)} kg/kg`
              : undefined
          }
        >
          {presets.map((fuel) => (
            <MenuItem key={fuel.id} value={fuel.id}>
              {fuel.name}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Stack spacing={2}>
          <TextField size="small" fullWidth label="Fuel name" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} />
          <Typography variant="body2">
            Elemental analysis, as fired (mass fractions): Σ = {formatValue(elementalSum)}
            {sumOff && (
              <Typography component="span" variant="body2" color="warning.main">
                {' '}
                — must be 1
              </Typography>
            )}
          </Typography>
          <NumberFieldGrid
            fields={COMBUSTION_FIELDS.elemental}
            values={value.elemental}
            onChange={(key, next) => onChange({ ...value, elemental: { ...value.elemental, [key]: next } })}
            columns={4}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={value.energyBasis}
              onChange={(_, next: CondensedFuelDraft['energyBasis'] | null) => next && onChange({ ...value, energyBasis: next })}
            >
              <ToggleButton value="lhv">LHV</ToggleButton>
              <ToggleButton value="heatOfFormation">ΔHf</ToggleButton>
            </ToggleButtonGroup>
            <NumberField
              label={value.energyBasis === 'lhv' ? 'Lower heating value' : 'Formation enthalpy'}
              unit="J/kg"
              value={value.properties.energy_J_kg}
              onChange={(next) => setProperty('energy_J_kg', next)}
              min={value.energyBasis === 'lhv' ? 0 : undefined}
              required
            />
          </Stack>
          <NumberFieldGrid fields={COMBUSTION_FIELDS.customFuel} values={value.properties} onChange={setProperty} />
          {withBed && (
            <>
              <Typography variant="body2">Packed-bed properties</Typography>
              <NumberFieldGrid fields={COMBUSTION_FIELDS.customFuelBed} values={value.properties} onChange={setProperty} />
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}
