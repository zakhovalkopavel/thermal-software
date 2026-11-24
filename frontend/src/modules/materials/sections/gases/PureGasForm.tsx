import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CalculateButton, NumberField } from '@/shared/ui/calc';
import { CompoundAutocomplete } from '../../components/CompoundAutocomplete';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import { GASES_UI } from './constants/gases-ui.constants';
import type { PureGasFormProps } from './types/pure-gas-form-props.type';

export function PureGasForm({
  gases,
  onGasesChange,
  sweep,
  onSweepChange,
  pressure_Pa,
  onPressureChange,
  boundsHint,
  onCalculate,
  loading,
  formError,
}: PureGasFormProps) {
  const setGas = (index: number, next: (typeof gases)[number]) =>
    onGasesChange(gases.map((gas, i) => (i === index ? next : gas)));

  const excludeIds = gases.flatMap((gas) => {
    if (!gas) return [];
    return gas.source === 'registry' ? [gas.key] : [gas.id];
  });

  return (
    <Stack
      spacing={2}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <Typography variant="subtitle2">Gas</Typography>
      {gases.map((gas, index) => (
        <Stack key={index} direction="row" spacing={1} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <CompoundAutocomplete
              label={index === 0 ? 'Gas' : 'Compare with'}
              excludeIds={excludeIds.filter((id) => {
                if (!gas) return true;
                return gas.source === 'registry' ? id !== gas.key : id !== gas.id;
              })}
              value={gas}
              onChange={(selection) => setGas(index, selection)}
            />
          </Box>
          {index > 0 && (
            <IconButton aria-label="Remove gas" onClick={() => onGasesChange(gases.filter((_, i) => i !== index))}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ))}
      {gases.length < GASES_UI.maxCompared && (
        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => onGasesChange([...gases, null])}>
            Add gas to compare
          </Button>
        </Box>
      )}
      <Typography variant="subtitle2">Conditions</Typography>
      <TemperatureSweepFields value={sweep} onChange={onSweepChange} />
      {boundsHint && (
        <Typography variant="caption" color="text.secondary">
          {boundsHint}
        </Typography>
      )}
      <NumberField label="Pressure" unit="Pa" value={pressure_Pa} min={1} onChange={onPressureChange} />
      {formError && <Alert severity="warning">{formError}</Alert>}
      <Box>
        <CalculateButton loading={loading} disabled={!gases.some(Boolean)} />
      </Box>
    </Stack>
  );
}
