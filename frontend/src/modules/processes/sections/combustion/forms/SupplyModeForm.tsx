import { Stack } from '@mui/material';
import { NumberFieldGrid } from '../../../components/NumberFieldGrid';
import type { SupplyModeFormProps } from '../types/supply-mode-form-props.type';
import { AdvancedFields } from '../../../components/AdvancedFields';
import { CondensedFuelFields } from './CondensedFuelFields';
import { SupplyFields } from './SupplyFields';

export function SupplyModeForm<K extends string>({ value, onChange, presets, fields }: SupplyModeFormProps<K>) {
  const setValue = (key: K, next: number | null) => onChange({ ...value, values: { ...value.values, [key]: next } });
  return (
    <Stack spacing={2}>
      <CondensedFuelFields value={value.fuel} onChange={(fuel) => onChange({ ...value, fuel })} presets={presets} />
      <SupplyFields value={value.supply} onChange={(supply) => onChange({ ...value, supply })} />
      <NumberFieldGrid fields={fields.main} values={value.values} onChange={setValue} />
      <AdvancedFields>
        <NumberFieldGrid fields={fields.advanced} values={value.values} onChange={setValue} />
      </AdvancedFields>
    </Stack>
  );
}
