import { useEffect, useState } from 'react';
import { Alert, Button, Grid, Stack, Typography } from '@mui/material';
import { NumberField, ResultCard, formatValue } from '@/shared/ui/calc';
import { PackingModelsChart } from '../charts/PackingModelsChart';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import { useMix } from '../hooks/useMix';
import { usePacking } from '../hooks/usePacking';
import type { MixTabProps } from '../types/mix-tab-props.type';
import type { PackingModel } from '../types/packing-model.type';
import type { PackingResult } from '../types/packing-result.type';
import { AnalysisCard } from './AnalysisCard';

const UI = MINERAL_COMPOSITIONS_UI.packing;

export function PackingTab({ active }: MixTabProps) {
  const { completeFractions, state, dispatch } = useMix();
  const [pressure, setPressure] = useState<number | null>(null);
  const [efficiency, setEfficiency] = useState<number | null>(null);
  const packingReady =
    state.fractions.length > 0 && completeFractions.length === state.fractions.length;
  // Same cache as PackingSync when pressure/efficiency are empty; overrides refetch here.
  const { cpm, furnas } = usePacking(completeFractions, packingReady && active, pressure, efficiency);

  useEffect(() => {
    if (!active || !packingReady) return;
    if (state.packingModel === 'Furnas') {
      if (!furnas.data || efficiency === null) return;
      const { packingFraction_phi: phi, porosity_initial: porosity } = furnas.data;
      if (state.phi === phi && state.porosity === porosity) return;
      dispatch({ type: 'setPacking', phi, porosity, packingModel: 'Furnas' });
      return;
    }
    if (!cpm.data || pressure === null) return;
    const { packingFraction_phi: phi, porosity_initial: porosity } = cpm.data;
    if (state.phi === phi && state.porosity === porosity && state.packingModel === 'CPM') return;
    dispatch({ type: 'setPacking', phi, porosity, packingModel: 'CPM' });
  }, [
    active,
    packingReady,
    pressure,
    efficiency,
    cpm.data,
    furnas.data,
    state.packingModel,
    state.phi,
    state.porosity,
    dispatch,
  ]);

  const models: Array<{ model: PackingModel; query: typeof cpm }> = [
    { model: 'CPM', query: cpm },
    { model: 'Furnas', query: furnas },
  ];
  const results: Partial<Record<PackingModel, PackingResult>> = { CPM: cpm.data, Furnas: furnas.data };

  const isSelected = (model: PackingModel, result: PackingResult | undefined) =>
    Boolean(result) &&
    state.packingModel === model &&
    state.phi === result?.packingFraction_phi &&
    state.porosity === result?.porosity_initial;

  if (!active) return null;

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <NumberField
            label="CPM compaction pressure"
            unit="MPa"
            value={pressure}
            onChange={setPressure}
            min={UI.compactionPressureMin_MPa}
            helperText="Empty = backend default"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <NumberField
            label="Furnas efficiency factor"
            value={efficiency}
            onChange={setEfficiency}
            min={UI.efficiencyFactorMin}
            max={UI.efficiencyFactorMax}
            helperText="0–1; empty = backend default"
          />
        </Grid>
      </Grid>

      <Typography variant="body2" color="text.secondary">
        {state.phi !== null
          ? `Used by Water and Chemical (CPM by default): φ = ${formatValue(state.phi)}, porosity = ${formatValue(state.porosity)}${
              state.packingModel ? ` (${MIX_OPTION_LABELS.packingModel[state.packingModel]})` : ''
            }. Porosity can still be adjusted on those tabs.`
          : packingReady
            ? 'Computing packing…'
            : 'Complete every row (material, size, mass %, density) to compute packing.'}
      </Typography>

      {!packingReady && (
        <Alert severity="info">Packing updates as soon as every fraction row is complete — Σ = 100 % is not required to refresh φ.</Alert>
      )}

      <Grid container spacing={2}>
        {models.map(({ model, query }) => (
          <Grid key={model} size={{ xs: 12, md: 6 }}>
            <AnalysisCard
              title={MIX_OPTION_LABELS.packingModel[model]}
              loading={query.isLoading || query.isFetching}
              error={query.error}
              hasResult={Boolean(query.data)}
            >
              {query.data && (
                <Stack spacing={1}>
                  <Grid container spacing={1}>
                    <Grid size={4}>
                      <ResultCard label="Packing fraction φ" value={query.data.packingFraction_phi} />
                    </Grid>
                    <Grid size={4}>
                      <ResultCard label="Green porosity" value={query.data.porosity_initial} />
                    </Grid>
                    <Grid size={4}>
                      <ResultCard label="Effective packing density" value={query.data.effectivePackingDensity} />
                    </Grid>
                  </Grid>
                  {query.data.composition && (
                    <Alert severity="info">
                      {query.data.composition.psdType} PSD, packing quality {query.data.composition.packingQuality}, micro-fillers{' '}
                      {formatValue(query.data.composition.microFillerPercent)} %, recommended max φ {formatValue(query.data.composition.recommendedMaxPhi)}.{' '}
                      {query.data.composition.explanation}
                    </Alert>
                  )}
                  <Button
                    variant={isSelected(model, query.data) ? 'contained' : 'outlined'}
                    onClick={() =>
                      query.data &&
                      dispatch({
                        type: 'setPacking',
                        phi: query.data.packingFraction_phi,
                        porosity: query.data.porosity_initial,
                        packingModel: model,
                      })
                    }
                  >
                    {isSelected(model, query.data)
                      ? 'In use'
                      : model === 'CPM'
                        ? 'Use CPM (default)'
                        : `Use ${MIX_OPTION_LABELS.packingModel[model]}`}
                  </Button>
                </Stack>
              )}
            </AnalysisCard>
          </Grid>
        ))}
      </Grid>

      {(cpm.data || furnas.data) && <PackingModelsChart results={results} />}
    </Stack>
  );
}
