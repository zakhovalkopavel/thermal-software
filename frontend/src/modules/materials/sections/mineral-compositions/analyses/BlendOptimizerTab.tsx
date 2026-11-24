import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Grid, Radio, Stack, Typography } from '@mui/material';
import { CalculateButton, JsonErrorAlert, ResultTable, formatValue } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { BlendResultMapChart } from '../charts/BlendResultMapChart';
import { SelectedFormulationChart } from '../charts/SelectedFormulationChart';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import { useBlendOptimization } from '../hooks/useBlendOptimization';
import { useMix } from '../hooks/useMix';
import { toAppliedMassPercents } from '../mappers/applied-mass-percents.mapper';
import { toBlendBestBy } from '../mappers/blend-best-by.mapper';
import { toBlendOptimizationInput } from '../mappers/blend-request.mapper';
import { toBlendResultId } from '../mappers/blend-result-id.mapper';
import { toFractionLabel } from '../mappers/fraction-label.mapper';
import type { BlendOptions } from '../types/blend-options.type';
import type { BlendRequestState } from '../types/blend-request-state.type';
import type { BlendResult } from '../types/blend-result.type';
import type { PsdMethod } from '../types/psd-method.type';
import { BlendOptionsForm } from './BlendOptionsForm';

const UI = MINERAL_COMPOSITIONS_UI;
const BLEND = UI.blend;

const INITIAL_OPTIONS: BlendOptions = {
  qValues: [...BLEND.defaultQValues],
  methods: [...BLEND.defaultMethods],
  packingModels: [...BLEND.defaultPackingModels],
  scenarios: [...BLEND.defaultScenarios],
  waterCementRatio: BLEND.defaultWaterCementRatio,
};

export function BlendOptimizerTab() {
  const { completeFractions, components, state, dispatch } = useMix();
  const [options, setOptions] = useState<BlendOptions>(INITIAL_OPTIONS);
  const [request, setRequest] = useState<BlendRequestState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const optimization = useBlendOptimization(request?.input ?? null);
  const results = useMemo(() => optimization.data ?? [], [optimization.data]);
  const bestBy = useMemo(() => toBlendBestBy(results), [results]);

  const outOfRange = completeFractions.filter(
    (fraction) => fraction.density_kgm3 < UI.densityMin_kgm3 || fraction.density_kgm3 > UI.densityMax_kgm3,
  );
  const missingOption =
    options.qValues.length === 0 || options.methods.length === 0 || options.packingModels.length === 0 || options.scenarios.length === 0;

  const selected = results.find((result) => toBlendResultId(result) === selectedId);
  const current = request
    ? request.fractionIds.map((id) => state.fractions.find((fraction) => fraction.id === id)?.massPercent ?? 0)
    : [];
  const mixChanged = request !== null && request.fractionIds.some((id) => !state.fractions.some((fraction) => fraction.id === id));

  const run = () => {
    setRequest({
      input: toBlendOptimizationInput(completeFractions, options),
      fractionIds: completeFractions.map((fraction) => fraction.id),
      labels: completeFractions.map((fraction) => toFractionLabel(fraction, components)),
    });
    setSelectedId(null);
    setAppliedId(null);
  };

  const apply = (result: BlendResult) => {
    if (!request) return;
    dispatch({ type: 'applyMassPercents', massPercents: toAppliedMassPercents(result, request.fractionIds) });
    setAppliedId(toBlendResultId(result));
  };

  const columns: ResultTableColumn<BlendResult>[] = [
    {
      key: 'select',
      label: '',
      align: 'center',
      render: (result) => (
        <Radio size="small" checked={toBlendResultId(result) === selectedId} onChange={() => setSelectedId(toBlendResultId(result))} />
      ),
    },
    { key: 'rank', label: '#', align: 'left' },
    { key: 'method', label: 'Method', align: 'left', render: (result) => MIX_OPTION_LABELS.psdMethod[result.method as PsdMethod] ?? result.method },
    { key: 'q', label: 'q' },
    { key: 'packingModel', label: 'Packing', align: 'left' },
    { key: 'scenario', label: 'Scenario', align: 'left' },
    { key: 'massFractionsRoundedPercent', label: 'Mass', unit: '%', align: 'left', render: (result) => result.massFractionsRoundedPercent.join(' / ') },
    { key: 'packingEfficiency', label: 'Packing eff.' },
    { key: 'porosity_percent_green', label: 'Porosity', unit: '%' },
    { key: 'rhoBulk_gml_green', label: 'ρ green', unit: 'g/ml' },
    { key: 'waterDemand_percent', label: 'Water', unit: '%' },
    { key: 'shrinkage', label: 'Max shrinkage', unit: '%', render: (result) => formatValue(result.shrinkage.metadata.maxShrinkage_volumetric_percent) },
    { key: 'optimizationScore', label: 'Score' },
  ];

  if (outOfRange.length > 0) {
    return (
      <Alert severity="warning">
        The optimiser accepts densities {UI.densityMin_kgm3}–{UI.densityMax_kgm3} kg/m³. Adjust or remove:{' '}
        {outOfRange.map((fraction) => `${toFractionLabel(fraction, components)} (${fraction.density_kgm3} kg/m³)`).join(', ')}.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        component="form"
        spacing={2}
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
      >
        <BlendOptionsForm value={options} onChange={setOptions} />
        {missingOption && <Alert severity="info">Select at least one q, method, packing model and scenario.</Alert>}
        <Box>
          <CalculateButton loading={optimization.isFetching} disabled={missingOption}>
            Optimise blend
          </CalculateButton>
        </Box>
      </Stack>

      {optimization.error && <JsonErrorAlert error={optimization.error} />}

      {request && results.length > 0 && (
        <Stack spacing={2}>
          {mixChanged && <Alert severity="warning">Fractions were added or removed after this run; re-run before applying.</Alert>}
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2">Best by:</Typography>
            {bestBy.map((item) => (
              <Chip
                key={item.label}
                size="small"
                label={`${item.label}: #${item.id} (${formatValue(item.value)}${item.unit ? ` ${item.unit}` : ''})`}
                color={item.id === selectedId ? 'primary' : 'default'}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <BlendResultMapChart results={results} bestBy={bestBy} selectedId={selectedId} onSelect={setSelectedId} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              {selected ? (
                <Stack spacing={1}>
                  <SelectedFormulationChart labels={request.labels} current={current} selected={selected} />
                  <Button variant="contained" disabled={mixChanged} onClick={() => apply(selected)}>
                    {appliedId === selectedId ? `Result #${selected.rank} applied` : `Apply result #${selected.rank} to mix`}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Fixed fractions are not changed.
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="info">Select a result in the map or the table to compare it with the current mix.</Alert>
              )}
            </Grid>
          </Grid>
          <ResultTable columns={columns} rows={results} rowKey={toBlendResultId} maxHeight={BLEND.tableMaxHeight} />
        </Stack>
      )}
      {request && optimization.isSuccess && results.length === 0 && <Alert severity="info">The optimiser returned no feasible formulation.</Alert>}
    </Stack>
  );
}
