import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { NumberField, ResultCard, ResultTable } from '../../../../components/calc';
import type { ResultTableColumn } from '../../../../components/calc';
import { HtcVelocityChart } from './charts/HtcVelocityChart';
import { NusseltReynoldsChart } from './charts/NusseltReynoldsChart';
import { HTC_DEFAULTS } from './constants/htc-defaults.constants';
import { HTC_UI } from './constants/htc-ui.constants';
import { useVelocitySweep } from './hooks/useVelocitySweep';
import { toCorrelationRows } from './mappers/correlation-rows.mapper';
import { toCorrelationWarnings } from './mappers/correlation-warnings.mapper';
import { toVelocityGrid } from './mappers/velocity-grid.mapper';
import type { CorrelationRow } from './types/correlation-row.type';
import type { DimensionlessInput } from './types/dimensionless-input.type';
import type { HtcResultsProps } from './types/htc-results-props.type';
import type { VelocitySweepDraft } from './types/velocity-sweep-draft.type';

const CORRELATION_COLUMNS: ResultTableColumn<CorrelationRow>[] = [
  { key: 'name', label: 'Correlation', align: 'left', render: (row) => (row.used ? <strong>{row.name} (used)</strong> : row.name) },
  { key: 'Nu', label: 'Nu' },
  { key: 'h_W_m2K', label: 'h', unit: 'W/(m²·K)' },
  {
    key: 'rangeValid',
    label: 'In range',
    align: 'center',
    render: (row) => <Chip size="small" label={row.rangeValid ? 'yes' : 'no'} color={row.rangeValid ? 'success' : 'default'} variant="outlined" />,
  },
  { key: 'warning', label: 'Warning', align: 'left' },
];

export function HtcResults({ input, result, correlations }: HtcResultsProps) {
  const [sweep, setSweep] = useState<VelocitySweepDraft>(HTC_DEFAULTS.sweep);
  const [sweepRequest, setSweepRequest] = useState<{ input: DimensionlessInput; velocities: number[] } | null>(null);
  const [sweepError, setSweepError] = useState<string | null>(null);
  const activeSweep = sweepRequest?.input === input ? sweepRequest : null;
  const sweepResult = useVelocitySweep(activeSweep?.input ?? null, activeSweep?.velocities ?? []);

  const selected = correlations.find((item) => item.name === (input.preferredCorrelation ?? result.correlation));
  const warnings = useMemo(() => toCorrelationWarnings(selected, result), [selected, result]);
  const rows = useMemo(() => toCorrelationRows(result), [result]);
  const setSweepValue = (key: keyof VelocitySweepDraft) => (value: number | null) => setSweep((previous) => ({ ...previous, [key]: value }));

  const runSweep = () => {
    try {
      setSweepRequest({ input, velocities: toVelocityGrid(sweep) });
      setSweepError(null);
    } catch (error) {
      setSweepError((error as Error).message);
    }
  };

  return (
    <Stack spacing={2}>
      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="h" value={result.h_W_m2K} unit="W/(m²·K)" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Nu" value={result.Nu} hint={result.correlation} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Re" value={result.Re} hint={`Regime: ${result.regime}`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Pr" value={result.Pr} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Gr" value={result.Gr} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Ra" value={result.Ra} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Convection" value={result.isNatural ? 'natural' : 'forced'} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Correlation in range" value={result.rangeValid ? 'yes' : 'no'} />
        </Grid>
      </Grid>
      {result.preferredRequested && !result.preferredUsed && (
        <Alert severity="warning">
          {result.preferredRequested} was not used: {result.preferredRejectedReason ?? 'rejected by the backend'}. {result.correlation} was used instead.
        </Alert>
      )}
      {result.warning && <Alert severity="warning">{result.warning}</Alert>}
      {warnings.map((warning) => (
        <Alert key={warning} severity="info">
          {warning}
        </Alert>
      ))}
      {rows.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            All applicable correlations
          </Typography>
          <ResultTable columns={CORRELATION_COLUMNS} rows={rows} rowKey={(row) => row.name} maxHeight={HTC_UI.correlationTableMaxHeight} />
          <Typography variant="caption" color="text.secondary">
            h per correlation is scaled from the used one (same λ and characteristic length).
          </Typography>
        </Box>
      )}
      <Stack spacing={1}>
        <Typography variant="subtitle2">Velocity sweep</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <NumberField label="From" unit="m/s" value={sweep.from_m_s} onChange={setSweepValue('from_m_s')} min={0} />
          <NumberField label="To" unit="m/s" value={sweep.to_m_s} onChange={setSweepValue('to_m_s')} min={0} />
          <NumberField
            label="Points"
            value={sweep.points}
            onChange={setSweepValue('points')}
            min={HTC_UI.sweep.minPoints}
            max={HTC_UI.sweep.maxPoints}
            step={1}
          />
          <Button variant="outlined" onClick={runSweep} disabled={sweepResult.loading} sx={{ flexShrink: 0 }}>
            Run sweep
          </Button>
        </Stack>
        {activeSweep && sweepResult.loading && <LinearProgress />}
        {sweepError && <Alert severity="warning">{sweepError}</Alert>}
        {sweepResult.failed > 0 && <Alert severity="warning">{sweepResult.failed} sweep point(s) failed and are not plotted.</Alert>}
      </Stack>
      {activeSweep && !sweepResult.loading && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, xl: 6 }}>
            <HtcVelocityChart points={sweepResult.points} correlation={selected} />
          </Grid>
          <Grid size={{ xs: 12, xl: 6 }}>
            <NusseltReynoldsChart points={sweepResult.points} correlation={selected} />
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
