import { Alert, Grid, Stack } from '@mui/material';
import { ResultCard, formatValue } from '../../../../components/calc';
import { kelvinToCelsius } from '../../mappers/kelvin-to-celsius.mapper';
import { CounterFlowChart } from './charts/CounterFlowChart';
import { EnergyBalanceChart } from './charts/EnergyBalanceChart';
import { FlameTemperatureChart } from './charts/FlameTemperatureChart';
import { VelocitiesChart } from './charts/VelocitiesChart';
import type { RecuperatorResultsProps } from './types/recuperator-results-props.type';

const celsiusHint = (kelvin: number) => `${formatValue(kelvinToCelsius(kelvin))} °C`;

export function RecuperatorResults({ input, result }: RecuperatorResultsProps) {
  const lengthDiffers = Math.abs(result.recuperatorLength_m - input.wantedRecuperatorLength_m) > Number.EPSILON;
  return (
    <Stack spacing={2}>
      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Recuperator length" value={result.recuperatorLength_m} unit="m" hint={`Target ${formatValue(input.wantedRecuperatorLength_m)} m`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Air outlet T" value={result.tAirEnd_K} unit="K" hint={celsiusHint(result.tAirEnd_K)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Smoke inlet / outlet T" value={result.tSmokeStart_K} unit="K" hint={`Outlet ${formatValue(result.tSmokeEnd_K)} K`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Energy returned" value={result.energyReturnedPercent} unit="%" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Flame T / max" value={result.tFlame_K} unit="K" hint={`Max ${formatValue(result.maxFlameTemp_K)} K`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Average α" value={result.alphaAverage_Wm2K} unit="W/(m²·K)" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Mean ΔT" value={result.averageDeltaT_K} unit="K" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Fuel flow" value={result.mFuel_kgh} unit="kg/h" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Air energy increase" value={result.airEnergyIncrease_W} unit="W" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Smoke energy total / decrease" value={result.smokeTotalEnergy_W} unit="W" hint={`Decrease ${formatValue(result.smokeEnergyDecrease_W)} W`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Cross-section smoke / air" value={result.sSmoke_m2} unit="m²" hint={`Air ${formatValue(result.sAir_m2)} m²`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <ResultCard label="Hydraulic d smoke / air" value={result.dSmoke_m} unit="m" hint={`Air ${formatValue(result.dAir_m)} m`} />
        </Grid>
      </Grid>
      {lengthDiffers && (
        <Alert severity="info">
          The backend returned a length of {formatValue(result.recuperatorLength_m)} m for a target of {formatValue(input.wantedRecuperatorLength_m)} m.
        </Alert>
      )}
      <CounterFlowChart input={input} result={result} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <EnergyBalanceChart input={input} result={result} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FlameTemperatureChart input={input} result={result} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <VelocitiesChart input={input} result={result} />
        </Grid>
      </Grid>
    </Stack>
  );
}
