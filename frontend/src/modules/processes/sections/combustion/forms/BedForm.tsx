import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { NumberField } from '@/shared/ui/calc';
import { NumberFieldGrid } from '../../../components/NumberFieldGrid';
import { WallLayersEditor } from '../../../components/WallLayersEditor';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { BedDraft } from '../types/bed-draft.type';
import type { BedFieldKey } from '../types/bed-field-key.type';
import type { CombustionFormProps } from '../types/combustion-form-props.type';
import { AdvancedFields } from '../../../components/AdvancedFields';
import { CondensedFuelFields } from './CondensedFuelFields';

export function BedForm({ value, onChange, presets }: CombustionFormProps<BedDraft>) {
  const setValue = (key: BedFieldKey, next: number | null) => onChange({ ...value, values: { ...value.values, [key]: next } });
  const { primaryAir, secondaryAir } = value;

  return (
    <Stack spacing={2}>
      <CondensedFuelFields value={value.fuel} onChange={(fuel) => onChange({ ...value, fuel })} presets={presets} withBed />
      <NumberFieldGrid fields={COMBUSTION_FIELDS.bed.main} values={value.values} onChange={setValue} />

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={primaryAir.basis}
          onChange={(_, basis: BedDraft['primaryAir']['basis'] | null) => basis && onChange({ ...value, primaryAir: { basis, value: null } })}
        >
          <ToggleButton value="flow">m³/h</ToggleButton>
          <ToggleButton value="mass">kg/s</ToggleButton>
        </ToggleButtonGroup>
        <NumberField
          label={primaryAir.basis === 'flow' ? 'Primary air flow (at inlet T, 1 atm)' : 'Primary air mass flow'}
          unit={primaryAir.basis === 'flow' ? 'm³/h' : 'kg/s'}
          value={primaryAir.value}
          onChange={(next) => onChange({ ...value, primaryAir: { ...primaryAir, value: next } })}
          min={0}
          helperText="Empty = 10 m³/h"
        />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={secondaryAir.basis}
          onChange={(_, basis: BedDraft['secondaryAir']['basis'] | null) => basis && onChange({ ...value, secondaryAir: { basis, value: null } })}
        >
          <ToggleButton value="excess">λ</ToggleButton>
          <ToggleButton value="mass">kg/s</ToggleButton>
        </ToggleButtonGroup>
        <NumberField
          label={secondaryAir.basis === 'excess' ? 'Total excess air λ' : 'Secondary air mass flow'}
          unit={secondaryAir.basis === 'excess' ? undefined : 'kg/s'}
          value={secondaryAir.value}
          onChange={(next) => onChange({ ...value, secondaryAir: { ...secondaryAir, value: next } })}
          min={0}
          helperText={secondaryAir.basis === 'excess' ? 'Relative to the fuel burned in the bed' : undefined}
        />
      </Stack>

      <WallLayersEditor
        title="Generator wall (inside → outside; no layers = adiabatic)"
        value={value.generatorWallLayers}
        onChange={(generatorWallLayers) => onChange({ ...value, generatorWallLayers })}
      />

      <Stack spacing={1}>
        <Typography variant="subtitle2">Burnout furnace heat loss</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={value.furnaceMode}
          onChange={(_, furnaceMode: BedDraft['furnaceMode'] | null) => furnaceMode && onChange({ ...value, furnaceMode })}
        >
          <ToggleButton value="none">None</ToggleButton>
          <ToggleButton value="walls">From furnace walls</ToggleButton>
          <ToggleButton value="loss">Fixed loss</ToggleButton>
        </ToggleButtonGroup>
        {value.furnaceMode === 'walls' && (
          <Stack spacing={2}>
            <NumberFieldGrid
              fields={COMBUSTION_FIELDS.furnace}
              values={value.furnace}
              onChange={(key, next) => onChange({ ...value, furnace: { ...value.furnace, [key]: next } })}
              columns={3}
            />
            <WallLayersEditor
              title="Furnace wall (inside → outside)"
              value={value.furnaceWallLayers}
              onChange={(furnaceWallLayers) => onChange({ ...value, furnaceWallLayers })}
            />
          </Stack>
        )}
        {value.furnaceMode === 'loss' && (
          <NumberField
            label="Furnace heat loss"
            unit="W"
            value={value.furnaceHeatLoss_W}
            onChange={(furnaceHeatLoss_W) => onChange({ ...value, furnaceHeatLoss_W })}
            min={0}
          />
        )}
      </Stack>

      <AdvancedFields>
        <NumberFieldGrid fields={COMBUSTION_FIELDS.bed.advanced} values={value.values} onChange={setValue} />
      </AdvancedFields>
    </Stack>
  );
}
