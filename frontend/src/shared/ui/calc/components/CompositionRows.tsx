import { Autocomplete, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { NumberField } from './NumberField';

type CompositionRowsProps = {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  options: readonly string[];
  freeKeys: boolean;
  readOnly?: boolean;
  unit: string;
  keyLabel: string;
  max: number;
  addLabel: string;
};

export function CompositionRows({
  value,
  onChange,
  options,
  freeKeys,
  readOnly,
  unit,
  keyLabel,
  max,
  addLabel,
}: CompositionRowsProps) {
  const entries = Object.entries(value);
  const used = new Set(entries.map(([key]) => key));
  const nextKey = options.find((key) => !used.has(key));

  const rename = (index: number, key: string) => {
    const trimmed = key.trim();
    if (!trimmed || (used.has(trimmed) && entries[index][0] !== trimmed)) return;
    onChange(Object.fromEntries(entries.map(([k, v], i) => (i === index ? [trimmed, v] : [k, v]))));
  };
  const setAmount = (index: number, amount: number | null) =>
    onChange(Object.fromEntries(entries.map(([k, v], i) => (i === index ? [k, amount ?? 0] : [k, v]))));
  const remove = (index: number) => onChange(Object.fromEntries(entries.filter((_, i) => i !== index)));
  const add = () => nextKey && onChange({ ...value, [nextKey]: 0 });

  if (readOnly) {
    return (
      <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.5, m: 0 }}>
        {entries.map(([key, amount]) => (
          <Box key={key} sx={{ display: 'contents' }}>
            <Typography component="dt">{key}</Typography>
            <Typography component="dd" sx={{ m: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {amount.toFixed(unit === '%' ? 2 : 4)} {unit}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {entries.map(([key, amount], index) => (
        <Stack key={index} direction="row" spacing={1} alignItems="center">
          <Autocomplete
            size="small"
            sx={{ flex: 1 }}
            options={options.filter((option) => option === key || !used.has(option))}
            value={key}
            freeSolo={freeKeys}
            autoSelect={freeKeys}
            disableClearable
            onChange={(_, next) => next && rename(index, next)}
            renderInput={(params) => <TextField {...params} label={keyLabel} />}
          />
          <Box sx={{ flex: 1 }}>
            <NumberField value={amount} onChange={(next) => setAmount(index, next)} unit={unit} min={0} max={max} />
          </Box>
          <IconButton size="small" aria-label={`Remove ${key}`} onClick={() => remove(index)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Box>
        <Button size="small" startIcon={<AddIcon />} onClick={add} disabled={!nextKey}>
          {addLabel}
        </Button>
      </Box>
    </Stack>
  );
}
