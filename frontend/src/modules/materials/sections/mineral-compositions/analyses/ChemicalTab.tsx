import { useState } from 'react';
import { Alert, Box, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { CalculateButton, NumberField, ResultCard, formatValue } from '@/shared/ui/calc';
import { toCelsiusGrid } from '../../../mappers/celsius-grid.mapper';
import { ConductivitySweepChart } from '../charts/ConductivitySweepChart';
import { LiquidFractionChart } from '../charts/LiquidFractionChart';
import { LiquidSolidPieChart } from '../charts/LiquidSolidPieChart';
import { MineralPhasesChart } from '../charts/MineralPhasesChart';
import { PhaseCompositionChart } from '../charts/PhaseCompositionChart';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { REFRACTORINESS_STANDARDS } from '../constants/refractoriness-standards.constants';
import { useChemicalAnalyses } from '../hooks/useChemicalAnalyses';
import { useMix } from '../hooks/useMix';
import { useMixComposition } from '../hooks/useMixComposition';
import type { ChemicalRequest } from '../types/chemical-request.type';
import type { RefractorinessStandard } from '../types/refractoriness-standard.type';
import { AnalysisCard } from './AnalysisCard';

const UI = MINERAL_COMPOSITIONS_UI.chemistry;

export function ChemicalTab() {
  const { completeFractions, state } = useMix();
  const composition = useMixComposition(completeFractions);
  const [temperature, setTemperature] = useState<number | null>(UI.defaultTemperature_C);
  const [totalMass, setTotalMass] = useState<number | null>(UI.defaultTotalMass);
  const [standard, setStandard] = useState<RefractorinessStandard>('ISO1893');
  const [testTemperature, setTestTemperature] = useState<number | null>(UI.defaultTestTemperature_C);
  const [porosityInput, setPorosityInput] = useState<number | null>(null);
  const [sweep, setSweep] = useState<{ from: number | null; to: number | null; step: number | null }>(UI.sweep);
  const [request, setRequest] = useState<ChemicalRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const analyses = useChemicalAnalyses(request);

  const porosity = porosityInput ?? state.porosity ?? UI.defaultPorosity;
  const normalized = composition.data?.acceptedOxides_normalized;
  const hasOxides = Boolean(normalized && Object.keys(normalized).length > 0);

  const run = () => {
    if (!normalized || !hasOxides) return setFormError('The mix has no accepted oxide; chemical analyses are not possible.');
    if (temperature === null || temperature < UI.temperatureMin_C || temperature > UI.temperatureMax_C) {
      return setFormError(`Temperature must be ${UI.temperatureMin_C}–${UI.temperatureMax_C} °C.`);
    }
    if (totalMass === null || totalMass <= 0) return setFormError('Enter a positive total mass.');
    if (testTemperature === null) return setFormError('Enter the refractoriness test temperature.');
    try {
      const grid = toCelsiusGrid(sweep.from, sweep.to, sweep.step, UI.sweepMaxPoints);
      setRequest({ composition: normalized, temperature, totalMass, standard, testTemperature, porosity, grid });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const lambdaAtT = analyses.lambda.find((item) => item.temperature === request?.temperature && item.porosity === request?.porosity);
  const refractoriness = analyses.refractoriness.data;

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
            <TextField select size="small" fullWidth label="Refractoriness standard" value={standard} onChange={(event) => setStandard(event.target.value as RefractorinessStandard)}>
              {REFRACTORINESS_STANDARDS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField label="Test temperature" unit="°C" value={testTemperature} onChange={setTestTemperature} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField
              label="Porosity P"
              value={porosity}
              onChange={setPorosityInput}
              min={0}
              max={1}
              helperText={porosityInput === null && state.porosity !== null ? 'From the Packing tab' : 'Volume fraction 0–1'}
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
          <CalculateButton loading={composition.isLoading}>Run chemical analyses</CalculateButton>
        </Box>
      </Stack>

      {request && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalysisCard title="Phase equilibrium" loading={analyses.phase.isLoading} error={analyses.phase.error} hasResult={Boolean(analyses.phase.data)}>
              {analyses.phase.data && (
                <Stack spacing={1}>
                  {analyses.phase.data.warnings.map((warning) => (
                    <Alert key={warning} severity="warning">
                      {warning}
                    </Alert>
                  ))}
                  <Typography variant="body2">
                    Liquid {formatValue(analyses.phase.data.liquid.percent)} % ({formatValue(analyses.phase.data.liquid.mass)} kg) · solid{' '}
                    {formatValue(analyses.phase.data.solid.percent)} % · eutectic {analyses.phase.data.metadata.eutecticTemperature} °C · liquidus ≈{' '}
                    {analyses.phase.data.metadata.estimatedLiquidus} °C
                  </Typography>
                  <Typography variant="body2">Solid phases: {analyses.phase.data.solid.mineralPhases.join(', ') || '—'}</Typography>
                  <LiquidSolidPieChart result={analyses.phase.data} />
                  <PhaseCompositionChart result={analyses.phase.data} />
                </Stack>
              )}
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
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalysisCard title="Mineral phases" loading={analyses.minerals.isLoading} error={analyses.minerals.error} hasResult={Boolean(analyses.minerals.data)}>
              {analyses.minerals.data && <MineralPhasesChart phases={analyses.minerals.data} />}
            </AnalysisCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalysisCard title="Refractoriness" loading={analyses.refractoriness.isLoading} error={analyses.refractoriness.error} hasResult={Boolean(refractoriness)}>
              {refractoriness && (
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <ResultCard label="Estimated refractoriness" value={refractoriness.estimatedRefractoriness_C} unit="°C" hint={refractoriness.classification} />
                  </Grid>
                  {refractoriness.PCE && (
                    <Grid size={6}>
                      <ResultCard label={`PCE cone ${refractoriness.PCE.coneNumber}`} value={refractoriness.PCE.equivalentTemperature_C} unit="°C" hint={refractoriness.PCE.description} />
                    </Grid>
                  )}
                  {refractoriness.RUL && (
                    <>
                      <Grid size={4}>
                        <ResultCard label="RUL T0.5" value={refractoriness.RUL.T05} unit="°C" />
                      </Grid>
                      <Grid size={4}>
                        <ResultCard label="RUL T1" value={refractoriness.RUL.T1} unit="°C" />
                      </Grid>
                      <Grid size={4}>
                        <ResultCard label="RUL T2" value={refractoriness.RUL.T2} unit="°C" hint={`${refractoriness.RUL.testLoad_MPa} MPa load`} />
                      </Grid>
                    </>
                  )}
                </Grid>
              )}
            </AnalysisCard>
          </Grid>
          <Grid size={12}>
            <AnalysisCard
              title="Effective thermal conductivity"
              loading={analyses.lambdaLoading}
              error={lambdaAtT?.error}
              hasResult={analyses.lambda.some((point) => point.result)}
            >
              <Stack spacing={1}>
                {lambdaAtT?.result && (
                  <Box sx={{ maxWidth: 280 }}>
                    <ResultCard label={`λ_eff at ${request.temperature} °C, P = ${request.porosity}`} value={lambdaAtT.result.thermalConductivity_WmK} unit="W/(m·K)" />
                  </Box>
                )}
                <ConductivitySweepChart points={analyses.lambda} porosity={request.porosity} />
              </Stack>
            </AnalysisCard>
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
