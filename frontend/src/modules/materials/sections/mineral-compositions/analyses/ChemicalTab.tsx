import { useState } from 'react';
import { Alert, Box, Grid, Stack, Typography } from '@mui/material';
import { CalculateButton, NumberField, ResultCard, formatValue } from '@/shared/ui/calc';
import { toCelsiusGrid } from '../../../mappers/celsius-grid.mapper';
import { ConductivitySweepChart } from '../charts/ConductivitySweepChart';
import { LiquidFractionChart } from '../charts/LiquidFractionChart';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { useChemicalAnalyses } from '../hooks/useChemicalAnalyses';
import { useMix } from '../hooks/useMix';
import { toPhaseFractions } from '../mappers/phase-fractions-request.mapper';
import type { ChemicalRequest } from '../types/chemical-request.type';
import { AnalysisCard } from './AnalysisCard';
import { PhaseEquilibriumSummary } from './PhaseEquilibriumSummary';

const UI = MINERAL_COMPOSITIONS_UI.chemistry;

/** Chemical analyses: CALPHAD phase equilibrium, liquid fraction vs T, λ_eff. */
export function ChemicalTab() {
  const { completeFractions, state } = useMix();
  const [temperature, setTemperature] = useState<number | null>(UI.defaultTemperature_C);
  const [totalMass, setTotalMass] = useState<number | null>(UI.defaultTotalMass);
  const [holdTime, setHoldTime] = useState<number | null>(UI.defaultHoldTime_hours);
  const [porosityInput, setPorosityInput] = useState<number | null>(null);
  const [sweep, setSweep] = useState<{ from: number | null; to: number | null; step: number | null }>(UI.sweep);
  const [request, setRequest] = useState<ChemicalRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const analyses = useChemicalAnalyses(request);

  const porosity = porosityInput ?? state.porosity ?? UI.defaultPorosity;

  const run = () => {
    if (temperature === null || temperature < UI.temperatureMin_C || temperature > UI.temperatureMax_C) {
      return setFormError(`Temperature must be ${UI.temperatureMin_C}–${UI.temperatureMax_C} °C.`);
    }
    if (totalMass === null || totalMass <= 0) return setFormError('Enter a positive total mass.');
    if (completeFractions.length === 0) return setFormError('Complete at least one size fraction of the mix for the phase equilibrium.');
    if (holdTime === null || holdTime <= UI.holdTimeMin_hours) return setFormError('Enter a positive hold time.');
    if (porosity < 0 || porosity > UI.porosityMax) {
      return setFormError(`Porosity must be 0–${UI.porosityMax}.`);
    }
    try {
      const grid = toCelsiusGrid(sweep.from, sweep.to, sweep.step, UI.sweepMaxPoints);
      setRequest({
        fractions: toPhaseFractions(completeFractions),
        holdTime_hours: holdTime,
        temperature,
        totalMass,
        porosity,
        grid,
      });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const porousThermal = analyses.lambda.find((item) => item.porosity === request?.porosity)?.result;
  const lambdaAtT = porousThermal?.points.find((point) => point.temperature_C === request?.temperature);
  const lambdaResults = analyses.lambda.flatMap((item) => (item.result ? [item.result] : []));
  const firedPhases = porousThermal
    ? Object.entries(porousThermal.firedPhases_wt)
        .sort(([, a], [, b]) => b - a)
        .map(([phase, share]) => `${phase} ${formatValue(share)} %`)
        .join(', ')
    : null;

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
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField label="Temperature" unit="°C" value={temperature} onChange={setTemperature} min={UI.temperatureMin_C} max={UI.temperatureMax_C} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField label="Total mass" unit="kg" value={totalMass} onChange={setTotalMass} min={0} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField label="Hold time" unit="h" value={holdTime} onChange={setHoldTime} min={UI.holdTimeMin_hours} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField
              label="Porosity P"
              value={porosity}
              onChange={setPorosityInput}
              min={0}
              max={UI.porosityMax}
              helperText={
                porosityInput === null && state.porosity !== null
                  ? `From ${state.packingModel ?? 'CPM'} packing (adjustable)`
                  : porosityInput !== null
                    ? 'Manual override — clear to use packing'
                    : `Volume fraction 0–${UI.porosityMax}`
              }
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2">Sweep for liquid fraction and λ_eff (≤ {UI.sweepMaxPoints} points):</Typography>
          <Box sx={{ width: 120 }}>
            <NumberField label="From" unit="°C" value={sweep.from} onChange={(from) => setSweep({ ...sweep, from })} />
          </Box>
          <Box sx={{ width: 120 }}>
            <NumberField label="To" unit="°C" value={sweep.to} onChange={(to) => setSweep({ ...sweep, to })} />
          </Box>
          <Box sx={{ width: 120 }}>
            <NumberField label="Step" unit="°C" value={sweep.step} onChange={(step) => setSweep({ ...sweep, step })} min={0} />
          </Box>
        </Stack>
        {formError && <Alert severity="warning">{formError}</Alert>}
        <Box>
          <CalculateButton>Run chemical analyses</CalculateButton>
        </Box>
      </Stack>

      {request && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalysisCard
              title="Phase equilibrium (CALPHAD)"
              loading={analyses.phase.isLoading}
              error={analyses.phase.error}
              hasResult={Boolean(analyses.phase.data)}
            >
              {analyses.phase.data && <PhaseEquilibriumSummary result={analyses.phase.data} />}
            </AnalysisCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalysisCard
              title="Liquid fraction vs T"
              loading={analyses.phaseSweepLoading}
              error={analyses.phaseSweep.every((point) => point.error) ? analyses.phaseSweep[0]?.error : undefined}
              hasResult={analyses.phaseSweep.some((point) => point.result)}
            >
              <LiquidFractionChart points={analyses.phaseSweep} />
            </AnalysisCard>
          </Grid>
          <Grid size={12}>
            <AnalysisCard
              title="Effective thermal conductivity"
              loading={analyses.lambdaLoading}
              error={analyses.lambda.find((item) => item.error)?.error}
              hasResult={lambdaResults.length > 0}
            >
              <Stack spacing={1}>
                {lambdaAtT && (
                  <Box sx={{ maxWidth: 280 }}>
                    <ResultCard
                      label={`λ_eff at ${request.temperature} °C, P = ${request.porosity}`}
                      value={lambdaAtT.lambdaEffective_WmK}
                      unit="W/(m·K)"
                    />
                  </Box>
                )}
                {porousThermal && (
                  <Typography variant="body2" color="text.secondary">
                    Fired phases (LOI {formatValue(porousThermal.lossOnIgnition_wt)} wt% removed): {firedPhases}. True density{' '}
                    {formatValue(porousThermal.trueDensity_kgm3)} kg/m³, bulk density {formatValue(porousThermal.bulkDensity_kgm3)} kg/m³
                    at P = {request.porosity}.
                  </Typography>
                )}
                {porousThermal?.warnings.map((warning) => (
                  <Alert key={warning} severity="info">
                    {warning}
                  </Alert>
                ))}
                <ConductivitySweepChart results={lambdaResults} porosity={request.porosity} />
              </Stack>
            </AnalysisCard>
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
