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

export function SizeFractionSelect({ options, value, onChange, disabled }: SizeFractionSelectProps) {
  const all = [...options, CUSTOM_OPTION];
  const selected = all.find((option) => option.key === value) ?? null;

  return (
    <Autocomplete
      size="small"
      disabled={disabled}
      options={all}
      value={selected}
      groupBy={(option) => option.groupLabel}
      getOptionLabel={(option) => option.range.grade || option.code}
      isOptionEqualToValue={(option, current) => option.key === current.key}
      onChange={(_, option) => option && onChange(option.key, option === CUSTOM_OPTION ? null : option.range)}
      renderInput={(params) => <TextField {...params} label="Size fraction" />}
      sx={{ minWidth: 200 }}
    />
  );
}
