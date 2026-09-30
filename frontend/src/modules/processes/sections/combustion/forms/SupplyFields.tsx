import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { NumberField } from '../../../../../components/calc';
import type { SupplyBasis } from '../types/supply-basis.type';
import type { SupplyFieldsProps } from '../types/supply-fields-props.type';

export function SupplyFields({ value, onChange }: SupplyFieldsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={value.basis}
        onChange={(_, basis: SupplyBasis | null) => basis && onChange({ basis, value: null })}
      >
        <ToggleButton value="power">Power</ToggleButton>
        <ToggleButton value="mass">Mass flow</ToggleButton>
      </ToggleButtonGroup>
      <NumberField
        label={value.basis === 'power' ? 'Fuel power (LHV)' : 'Fuel mass flow'}
        unit={value.basis === 'power' ? 'W' : 'kg/s'}
        value={value.value}
        onChange={(next) => onChange({ ...value, value: next })}
        min={0}
        required
      />
    </Stack>
  );
}
