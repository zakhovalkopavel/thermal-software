import { useMemo, useState } from 'react';
import { Alert, Button, Grid, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ResultCard, formatValue } from '../../../../components/calc';
import { PROCESSES_UI } from '../../constants/processes-ui.constants';
import { kelvinToCelsius } from '../../mappers/kelvin-to-celsius.mapper';
import type { CombustionHandOff } from '../../types/combustion-hand-off.type';
import type { CombustionRequest } from '../../types/combustion-request.type';
import type { SmokeHandOff } from '../../types/smoke-hand-off.type';
import { BedLayersTable } from './BedLayersTable';
import { BedProfileChart } from './charts/BedProfileChart';
import { ExcessAirSweepChart } from './charts/ExcessAirSweepChart';
import { MassBalanceChart } from './charts/MassBalanceChart';
import { ProductCompositionChart } from './charts/ProductCompositionChart';
import { CombustionProductsTable } from './CombustionProductsTable';
import { COMBUSTION_UI } from './constants/combustion-ui.constants';
import { useExcessAirSweep } from './hooks/useExcessAirSweep';
import { toCombustionModeInput } from './mappers/combustion-mode-input.mapper';
import { toCombustionSummary } from './mappers/combustion-summary.mapper';
import { toRequestExcessAir } from './mappers/excess-air-of-request.mapper';
import { toSmokeHandOff } from './mappers/smoke-hand-off.mapper';
import type { CombustionResultsProps } from './types/combustion-results-props.type';

const celsiusHint = (kelvin: number) => `${formatValue(kelvinToCelsius(kelvin))} °C`;

export function CombustionResults({ request, response }: CombustionResultsProps) {
  const navigate = useNavigate();
  const summary = useMemo(() => toCombustionSummary(response), [response]);
  const [sweepRequest, setSweepRequest] = useState<CombustionRequest | null>(null);
  const sweep = useExcessAirSweep(sweepRequest === request ? request : null);
  const canSweep = request.mode !== 'bed';

  const smokeState: SmokeHandOff = toSmokeHandOff(summary);
  const recuperatorState: CombustionHandOff = { combustion: toCombustionModeInput(request) };

  return (
    <Stack spacing={2}>
      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Flame temperature" value={summary.tFlame_K} unit="K" hint={celsiusHint(summary.tFlame_K)} />
        </Grid>
        {summary.tStep1_K !== undefined && (
          <Grid size={{ xs: 6, md: 3 }}>
            <ResultCard label="Generator gas temperature" value={summary.tStep1_K} unit="K" hint={celsiusHint(summary.tStep1_K)} />
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Fuel power (LHV)" value={summary.fPower_W} unit="W" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Fuel mass flow" value={summary.mFuel_kgs} unit="kg/s" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard
            label={summary.fuel.name}
            value={summary.fuel.lhv_Jkg / COMBUSTION_UI.joulesPerMegajoule}
            unit="MJ/kg"
            hint={`Stoichiometric air ${formatValue(summary.fuel.stoichAir_kgkg)} kg/kg`}
          />
        </Grid>
        {summary.feeds.map((feed) => (
          <Grid key={feed.label} size={{ xs: 6, md: 3 }}>
            <ResultCard label={feed.label} value={feed.kgs} unit="kg/s" />
          </Grid>
        ))}
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Flue gas" value={summary.lastStep.mGas_kgs} unit="kg/s" hint={`Unburnt C ${formatValue(summary.lastStep.charCarbon_kgs)} kg/s`} />
        </Grid>
        {summary.details.map((detail) => (
          <Grid key={detail.label} size={{ xs: 6, md: 3 }}>
            <ResultCard label={detail.label} value={detail.value} unit={detail.unit} />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate(PROCESSES_UI.paths.multilayerWall, { state: smokeState })}>
          Use smoke in multilayer wall
        </Button>
        <Button variant="outlined" onClick={() => navigate(PROCESSES_UI.paths.recuperator, { state: recuperatorState })}>
          Use in recuperator
        </Button>
        {canSweep && (
          <Button variant="outlined" onClick={() => setSweepRequest(request)} disabled={sweepRequest === request}>
            Sweep λ {COMBUSTION_UI.excessAirSweep.from}–{COMBUSTION_UI.excessAirSweep.to}
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ProductCompositionChart compositions={summary.compositions} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <MassBalanceChart summary={summary} />
        </Grid>
      </Grid>

      {sweepRequest === request && (
        <Stack spacing={1}>
          {sweep.loading && <Typography variant="body2">Calculating the sweep…</Typography>}
          <ExcessAirSweepChart points={sweep.points} kExcessAir={toRequestExcessAir(request)} />
        </Stack>
      )}

      {summary.layers && (
        <Stack spacing={2}>
          <BedProfileChart layers={summary.layers} />
          <BedLayersTable layers={summary.layers} />
        </Stack>
      )}

      <Typography variant="subtitle1">Products</Typography>
      <CombustionProductsTable steps={summary.steps} />
      {summary.lastStep.wgsKp !== null && (
        <Alert severity="info">Rich combustion: water–gas shift Kp = {formatValue(summary.lastStep.wgsKp)} at the outlet temperature.</Alert>
      )}
    </Stack>
  );
}
