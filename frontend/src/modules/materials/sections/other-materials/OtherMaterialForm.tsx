import { Alert, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { CalculateButton, NumberField } from '@/shared/ui/calc';
import { CompoundAutocomplete } from '../../components/CompoundAutocomplete';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import type { FluidPhase } from '../../types/fluid-phase.type';
import type { OtherMaterialFormProps } from './types/other-material-form-props.type';

export function OtherMaterialForm({
  selection,
  onSelectionChange,
  sweep,
  onSweepChange,
  pressure_Pa,
  onPressureChange,
  phase,
  onPhaseChange,
  gasCapable,
  liquidCapable,
  boundsChecked,
  boundsHint,
  onCalculate,
  loading,
  formError,
}: OtherMaterialFormProps) {
  const canCalculate = gasCapable || liquidCapable;
  const bothPhases = gasCapable && liquidCapable;

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
          Catalogue search covers organic and inorganic compounds. Gas or liquid properties are calculated when the record
          has usable transport equations for that phase.
        </Typography>
      )}
      {selection && boundsChecked && !canCalculate && (
        <Alert severity="info">
          No gas or liquid thermo/transport for this compound yet — identity only (typical for solids without tabulated
          fluid properties).
        </Alert>
      )}
      {bothPhases && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={phase}
          onChange={(_, next: FluidPhase | null) => next && onPhaseChange(next)}
        >
          <ToggleButton value="gas">Gas</ToggleButton>
          <ToggleButton value="liquid">Liquid</ToggleButton>
        </ToggleButtonGroup>
      )}
      {canCalculate && (
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
      <CalculateButton loading={loading} disabled={!selection || (canCalculate && pressure_Pa === null)} />
    </Stack>
  );
}
