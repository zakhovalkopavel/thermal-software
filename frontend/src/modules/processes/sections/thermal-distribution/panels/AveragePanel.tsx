import { useState } from 'react';
import { Alert, Button, Grid, Stack } from '@mui/material';
import { NumberField, ResultCard, ResultPanel } from '../../../../../components/calc';
import { AverageTemperatureChart } from '../charts/AverageTemperatureChart';
import { THERMAL_UI } from '../constants/thermal-ui.constants';
import { useAverageSweep } from '../hooks/useAverageSweep';
import { toTauSweepGrid } from '../mappers/tau-sweep-grid.mapper';
import type { ThermalPanelProps } from '../types/thermal-panel-props.type';

const DEFAULT_SWEEP = toTauSweepGrid(THERMAL_UI.averageSweep.defaultTauMax_s, THERMAL_UI.averageSweep.defaultPoints);

export function AveragePanel({ request }: ThermalPanelProps) {
  const [tauMax, setTauMax] = useState<number | null>(THERMAL_UI.averageSweep.defaultTauMax_s);
  const [points, setPoints] = useState<number | null>(THERMAL_UI.averageSweep.defaultPoints);
  const [taus, setTaus] = useState<number[]>(DEFAULT_SWEEP);
  const [sweepError, setSweepError] = useState<string | null>(null);
  const current = useAverageSweep(request, [request.tau]);
  const sweep = useAverageSweep(request, taus);
  const average = current.points[0]?.temperature;

  const applySweep = () => {
    try {
      setTaus(toTauSweepGrid(tauMax, points));
      setSweepError(null);
    } catch (error) {
      setSweepError((error as Error).message);
    }
  };

  return (
    <Stack spacing={2}>
      <ResultPanel loading={current.loading} error={current.error} hasResult={average !== undefined}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 6, md: 4 }}>
            <ResultCard label="Volume-average T" value={average} unit="°C" hint={`τ = ${request.tau} s`} />
          </Grid>
        </Grid>
      </ResultPanel>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <NumberField label="Up to τ" unit="s" value={tauMax} onChange={setTauMax} min={0} />
        <NumberField
          label="Points"
          value={points}
          onChange={setPoints}
          min={THERMAL_UI.averageSweep.minPoints}
          max={THERMAL_UI.averageSweep.maxPoints}
          step={1}
        />
        <Button variant="outlined" onClick={applySweep} sx={{ flexShrink: 0 }}>
          Apply
        </Button>
      </Stack>
      {sweepError && <Alert severity="warning">{sweepError}</Alert>}
      <ResultPanel loading={sweep.loading} error={sweep.error} hasResult={!sweep.loading && !sweep.error}>
        <AverageTemperatureChart request={request} points={sweep.points} />
      </ResultPanel>
    </Stack>
  );
}
