import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CalculateButton, NumberField } from '@/shared/ui/calc';
import { MaterialPicker } from '../../components/MaterialPicker';
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
  onCalculate,
  loading,
  formError,
}: PureGasFormProps) {
  const setGas = (index: number, key: string | null) => onGasesChange(gases.map((gas, i) => (i === index ? key : gas)));

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
            <MaterialPicker
              kinds={['gas']}
              label={index === 0 ? 'Gas' : 'Compare with'}
              excludeIds={[...GASES_UI.excludedPickerIds, ...gases.filter((key): key is string => Boolean(key) && key !== gas)]}
              value={gas ? { kind: 'gas', materialId: gas } : null}
              onChange={(selection) => setGas(index, selection?.materialId ?? null)}
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
      <NumberField label="Pressure" unit="Pa" value={pressure_Pa} min={1} onChange={onPressureChange} />
      {formError && <Alert severity="warning">{formError}</Alert>}
      <Box>
        <CalculateButton loading={loading} disabled={!gases.some(Boolean)} />
      </Box>
    </Stack>
  );
}
