import { useMemo, useState } from 'react';
import { Alert, Box, Checkbox, FormControlLabel, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { CalculateButton, CalculatorPage, GasCompositionInput, ResultPanel } from '../../../../components/calc';
import { useGasList } from '../../../materials';
import { AdvancedFields } from '../../components/AdvancedFields';
import { NumberFieldGrid } from '../../components/NumberFieldGrid';
import { HtcResults } from './HtcResults';
import { HTC_DEFAULTS } from './constants/htc-defaults.constants';
import { HTC_FIELDS } from './constants/htc-fields.constants';
import { useCorrelations } from './hooks/useCorrelations';
import { useDimensionless } from './hooks/useDimensionless';
import { useFlowGeometries } from './hooks/useFlowGeometries';
import { useFlowModes } from './hooks/useFlowModes';
import { toValidityText } from './mappers/correlation-validity-text.mapper';
import { toDimensionFieldSpecs } from './mappers/dimension-field-specs.mapper';
import { toDimensionlessInput } from './mappers/dimensionless-request.mapper';
import type { DimensionlessInput } from './types/dimensionless-input.type';
import type { FluidMode } from './types/fluid-mode.type';
import type { HtcDraft } from './types/htc-draft.type';
import type { HtcFieldKey } from './types/htc-field-key.type';

export function HtcCalculator() {
  const geometries = useFlowGeometries();
  const correlations = useCorrelations();
  const flowModes = useFlowModes();
  const gasList = useGasList();
  const [draft, setDraft] = useState<HtcDraft>(HTC_DEFAULTS.draft);
  const [input, setInput] = useState<DimensionlessInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const htc = useDimensionless(input);

  const geometry = geometries.data?.find((item) => item.key === draft.geometry);
  const dimensionFields = useMemo(() => (geometry ? toDimensionFieldSpecs(geometry) : []), [geometry]);
  const gasSpecies = useMemo(() => (gasList.data ?? []).filter((gas) => gas.formula !== null).map((gas) => gas.key), [gasList.data]);
  const correlationList = useMemo(() => correlations.data ?? [], [correlations.data]);
  const applicable = useMemo(() => correlationList.filter((item) => item.geometry.includes(draft.geometry)), [correlationList, draft.geometry]);
  const preferred = applicable.find((item) => item.name === draft.preferredCorrelation);

  const patch = (next: Partial<HtcDraft>) => setDraft((previous) => ({ ...previous, ...next }));
  const setValue = (key: HtcFieldKey, value: number | null) => setDraft((previous) => ({ ...previous, values: { ...previous.values, [key]: value } }));
  const setDimension = (key: string, value: number | null) => setDraft((previous) => ({ ...previous, dims: { ...previous.dims, [key]: value } }));
  const selectGeometry = (key: string) =>
    setDraft((previous) => ({
      ...previous,
      geometry: key,
      preferredCorrelation: correlationList.some((item) => item.name === previous.preferredCorrelation && item.geometry.includes(key))
        ? previous.preferredCorrelation
        : '',
    }));

  const calculate = () => {
    if (!geometry) return;
    try {
      setInput(toDimensionlessInput(draft, geometry));
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Heat-transfer coefficient"
      description="Re, Pr, Gr, Ra, Nu and the convective heat-transfer coefficient for a flow geometry and gas."
      inputs={
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          {geometries.error && <Alert severity="error">Geometries could not be loaded: {geometries.error.message}</Alert>}
          <TextField
            select
            size="small"
            fullWidth
            label="Geometry"
            value={geometry ? draft.geometry : ''}
            onChange={(event) => selectGeometry(event.target.value)}
            helperText={geometry?.key}
          >
            {(geometries.data ?? []).map((item) => (
              <MenuItem key={item.key} value={item.key}>
                {item.description}
              </MenuItem>
            ))}
          </TextField>
          {geometry && dimensionFields.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              This geometry needs no dimensions.
            </Typography>
          )}
          {dimensionFields.length > 0 && <NumberFieldGrid fields={dimensionFields} values={draft.dims} onChange={setDimension} />}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Fluid</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={draft.fluidMode}
              onChange={(_, mode: FluidMode | null) => mode && patch({ fluidMode: mode })}
            >
              <ToggleButton value="named">Single gas</ToggleButton>
              <ToggleButton value="mixture">Mixture</ToggleButton>
            </ToggleButtonGroup>
            {draft.fluidMode === 'named' ? (
              <TextField select size="small" fullWidth label="Gas" value={gasSpecies.includes(draft.fluid) ? draft.fluid : ''} onChange={(event) => patch({ fluid: event.target.value })}>
                {gasSpecies.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <GasCompositionInput value={draft.composition} onChange={(composition) => patch({ composition })} species={gasSpecies} />
            )}
          </Stack>
          <NumberFieldGrid fields={HTC_FIELDS.main} values={draft.values} onChange={setValue} columns={3} />
          <TextField
            select
            size="small"
            fullWidth
            label="Preferred correlation"
            value={preferred ? draft.preferredCorrelation : ''}
            onChange={(event) => patch({ preferredCorrelation: event.target.value })}
            helperText={preferred ? `Valid for ${toValidityText(preferred) || 'any range listed by the backend'}` : 'Auto: the backend picks the best valid correlation'}
          >
            <MenuItem value="">Auto</MenuItem>
            {applicable.map((item) => (
              <MenuItem key={item.name} value={item.name}>
                {item.name}
                {toValidityText(item) && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {toValidityText(item)}
                  </Typography>
                )}
              </MenuItem>
            ))}
          </TextField>
          <AdvancedFields>
            <Stack spacing={2}>
              <NumberFieldGrid fields={HTC_FIELDS.advanced} values={draft.values} onChange={setValue} />
              <TextField
                select
                size="small"
                fullWidth
                label="Force regime"
                value={draft.forceRegime}
                onChange={(event) => patch({ forceRegime: event.target.value })}
              >
                <MenuItem value="">Auto-detect</MenuItem>
                {(flowModes.data ?? []).map((mode) => (
                  <MenuItem key={mode.key} value={mode.key}>
                    {mode.key} — {mode.description}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={<Checkbox checked={draft.isHeating} onChange={(event) => patch({ isHeating: event.target.checked })} />}
                label="Fluid is heated by the surface"
              />
              <FormControlLabel
                control={<Checkbox checked={draft.compareAll} onChange={(event) => patch({ compareAll: event.target.checked })} />}
                label="Compare all applicable correlations"
              />
            </Stack>
          </AdvancedFields>
          {formError && <Alert severity="warning">{formError}</Alert>}
          <Box>
            <CalculateButton loading={htc.isFetching} disabled={!geometry} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel loading={htc.isLoading} error={htc.error} hasResult={Boolean(htc.data && input)}>
          {htc.data && input && <HtcResults input={input} result={htc.data} correlations={correlationList} />}
        </ResultPanel>
      }
    />
  );
}
