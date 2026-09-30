import { useState } from 'react';
import { Alert, Button, Grid, Stack, Typography } from '@mui/material';
import { NumberField, ResultCard, formatValue } from '../../../../../components/calc';
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
  const { completeFractions, ready, state, dispatch } = useMix();
  const [pressure, setPressure] = useState<number | null>(null);
  const [efficiency, setEfficiency] = useState<number | null>(null);
  const { cpm, furnas } = usePacking(completeFractions, active && ready, pressure, efficiency);

  const models: Array<{ model: PackingModel; query: typeof cpm }> = [
    { model: 'CPM', query: cpm },
    { model: 'Furnas', query: furnas },
  ];
  const results: Partial<Record<PackingModel, PackingResult>> = { CPM: cpm.data, Furnas: furnas.data };

  const isSelected = (result: PackingResult | undefined) =>
    Boolean(result) && state.phi === result?.packingFraction_phi && state.porosity === result?.porosity_initial;

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
          ? `Used by the Water and Chemical tabs: φ = ${formatValue(state.phi)}, porosity = ${formatValue(state.porosity)}`
          : 'Choose a model result to pass φ and porosity to the Water and Chemical tabs.'}
      </Typography>

      <Grid container spacing={2}>
        {models.map(({ model, query }) => (
          <Grid key={model} size={{ xs: 12, md: 6 }}>
            <AnalysisCard title={MIX_OPTION_LABELS.packingModel[model]} loading={query.isLoading} error={query.error} hasResult={Boolean(query.data)}>
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
                    variant={isSelected(query.data) ? 'contained' : 'outlined'}
                    onClick={() =>
                      query.data && dispatch({ type: 'setPacking', phi: query.data.packingFraction_phi, porosity: query.data.porosity_initial })
                    }
                  >
                    {isSelected(query.data) ? 'In use' : `Use ${MIX_OPTION_LABELS.packingModel[model]} result`}
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
