import { Autocomplete, TextField } from '@mui/material';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import type { SizeFractionSelectProps } from '../types/size-fraction-select-props.type';
import type { SizeOption } from '../types/size-option.type';

const CUSTOM_OPTION: SizeOption = {
  key: MINERAL_COMPOSITIONS_UI.customSizeKey,
  code: 'Custom',
  groupLabel: 'Custom',
  range: { dMin_mm: 0, dMax_mm: 0, d50_mm: 0, grade: 'Custom — enter dMin, dMax, d50' },
};

const AS_DELIVERED_OPTION: SizeOption = {
  key: MINERAL_COMPOSITIONS_UI.materialSizeKey,
  code: 'material',
  groupLabel: MINERAL_COMPOSITIONS_UI.messages.binderAsDelivered,
  range: {
    dMin_mm: 0,
    dMax_mm: 0,
    d50_mm: 0,
    grade: MINERAL_COMPOSITIONS_UI.messages.binderAsDelivered,
  },
};

export function SizeFractionSelect({ options, value, onChange, disabled, required, error, helperText }: SizeFractionSelectProps) {
  const binderLocked = value === MINERAL_COMPOSITIONS_UI.materialSizeKey;
  const all = binderLocked ? [AS_DELIVERED_OPTION] : [...options, CUSTOM_OPTION];
  const selected = all.find((option) => option.key === value) ?? null;

  return (
    <Autocomplete
      size="small"
      disabled={disabled || binderLocked}
      options={all}
      value={selected}
      groupBy={(option) => option.groupLabel}
      getOptionLabel={(option) => option.range.grade || option.code}
      isOptionEqualToValue={(option, current) => option.key === current.key}
      onChange={(_, option) => option && onChange(option.key, option === CUSTOM_OPTION ? null : option.range)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Size fraction"
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
      sx={{ minWidth: 200 }}
    />
  );
}
