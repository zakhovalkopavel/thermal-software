import { Alert, Stack, Typography } from '@mui/material';
import { CalculateButton, NumberField } from '@/shared/ui/calc';
import { CompoundAutocomplete } from '../../components/CompoundAutocomplete';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import type { OtherMaterialFormProps } from './types/other-material-form-props.type';

export function OtherMaterialForm({
  selection,
  onSelectionChange,
  sweep,
  onSweepChange,
  pressure_Pa,
  onPressureChange,
  gasCapable,
  gasChecked,
  boundsHint,
  onCalculate,
  loading,
  formError,
}: OtherMaterialFormProps) {
  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <CompoundAutocomplete
        label="Compound"
        value={selection}
        onChange={onSelectionChange}
        includeRegistry={false}
        gasesOnly={false}
      />
      {selection?.source === 'compound' && (
        <Typography variant="body2" color="text.secondary">
          Catalogue search covers organic and inorganic compounds in every phase. Gas thermo is calculated when the record
          has usable gas equations.
        </Typography>
      )}
      {selection && gasChecked && !gasCapable && (
        <Alert severity="info">
          No gas-phase thermo/transport for this compound yet — identity only. Solids and liquids stay catalogue lookup for
          now.
        </Alert>
      )}
      {gasCapable && (
        <>
          <NumberField
            label="Pressure"
            unit="Pa"
            value={pressure_Pa}
            onChange={onPressureChange}
            min={1}
            helperText={boundsHint ?? undefined}
          />
          <TemperatureSweepFields value={sweep} onChange={onSweepChange} />
        </>
      )}
      {formError && <Alert severity="warning">{formError}</Alert>}
      <CalculateButton loading={loading} disabled={!selection || (gasCapable && pressure_Pa === null)} />
    </Stack>
  );
}
