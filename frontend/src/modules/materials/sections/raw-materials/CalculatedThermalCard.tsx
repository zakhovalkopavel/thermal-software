import { useMemo, useState } from 'react';
import { Alert, Box, Checkbox, FormControlLabel, Grid, Stack, Typography } from '@mui/material';
import {
  CalculateButton,
  NumberField,
  ResultCard,
  ResultPanel,
  ResultTable,
  formatValue,
} from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { MixThermalResult } from '../../types/mix-thermal-result.type';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { EffectiveConductivityChart } from './charts/EffectiveConductivityChart';
import { SpecificHeatChart } from './charts/SpecificHeatChart';
import { RAW_MATERIALS_UI } from './constants/raw-materials-ui.constants';
import { useRawMaterialThermal } from './hooks/useRawMaterialThermal';
import { toFiredPhaseRows } from './mappers/fired-phase-rows.mapper';
import type { CalculatedThermalCardProps } from './types/calculated-thermal-card-props.type';
import type { RawMaterialThermalPoint } from './types/raw-material-thermal-point.type';
import type { RawMaterialThermalRequest } from './types/raw-material-thermal-request.type';

type TableRow = RawMaterialThermalPoint & { temperature_K: number };

const COLUMNS: ResultTableColumn<TableRow>[] = [
  { key: 'temperature_C', label: 'T', unit: '°C' },
  { key: 'temperature_K', label: 'T', unit: 'K' },
  { key: 'lambda_WmK', label: 'λ_eff', unit: 'W/(m·K)' },
  { key: 'cp_JkgK', label: 'Cp', unit: 'J/(kg·K)' },
  { key: 'rho_kgm3', label: 'ρ (bulk)', unit: 'kg/m³' },
  { key: 'diffusivity_m2s', label: 'a', unit: 'm²/s' },
];

const LAMBDA_SOURCE_LABEL: Record<MixThermalResult['materials'][number]['lambdaReferenceSource'], string> = {
  library: 'library value',
  'group-median': 'median of its group (no library value)',
};

const LAW_LABEL: Record<MixThermalResult['materials'][number]['conductionLaw'], string> = {
  phonon: 'phonon conduction, decreases with T',
  electronic: 'electronic conduction, constant with T',
};

const toCelsius = (T_K: number) =>
  Number(kelvinToCelsius(T_K).toFixed(RAW_MATERIALS_UI.temperatureDecimals));

function FiredBasis({ result }: { result: MixThermalResult }) {
  const basis = result.materials[0];
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        Fired phases (loss on ignition {formatValue(result.lossOnIgnition_wt)} wt% removed):{' '}
        {toFiredPhaseRows(result.firedPhases_wt)
          .map((row) => `${row.phase} ${formatValue(row.share_wt)} %`)
          .join(', ')}
      </Typography>
      <Typography variant="body2">
        Cp from NASA-9 phase data for{' '}
        <b>{formatValue(result.heatCapacityCoverage_wt, RAW_MATERIALS_UI.coverageDigits)} %</b> of the fired mass;
        dense λ_ref = <b>{formatValue(basis.lambdaReference_WmK)} W/(m·K)</b> ({LAMBDA_SOURCE_LABEL[basis.lambdaReferenceSource]},{' '}
        {LAW_LABEL[basis.conductionLaw]}); true density <b>{formatValue(result.trueDensity_kgm3)} kg/m³</b>.
      </Typography>
    </Stack>
  );
}

export function CalculatedThermalCard({ material, eligible, comparedEligible }: CalculatedThermalCardProps) {
  const [sweep, setSweep] = useState<TemperatureSweep>(RAW_MATERIALS_UI.defaultSweep);
  const [porosity, setPorosity] = useState<number | null>(RAW_MATERIALS_UI.defaultPorosity);
  const [includeDense, setIncludeDense] = useState(false);
  const [request, setRequest] = useState<RawMaterialThermalRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const result = useRawMaterialThermal(request);

  const names = useMemo(
    () => Object.fromEntries([material, ...comparedEligible].map((entry) => [entry.materialId, entry.name])),
    [material, comparedEligible],
  );

  const heading = <Typography variant="subtitle1">Calculated vs temperature (fired material)</Typography>;

  if (!eligible) {
    return (
      <Stack spacing={1}>
        {heading}
        <Alert severity="info">
          {material.name} is not a mix raw material, so the calculated block is not available. Reference values are
          shown above.
        </Alert>
      </Stack>
    );
  }

  const calculate = () => {
    if (porosity === null) return setFormError('Enter the porosity.');
    try {
      setRequest({
        materialIds: [material.materialId, ...comparedEligible.map((entry) => entry.materialId)],
        temperatures_C: toTemperatureGrid(sweep).map(toCelsius),
        porosity,
        includeDense,
      });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const selected = result.results[material.materialId];
  const selectedRows: TableRow[] = result.points
    .filter((point) => point.materialId === material.materialId && point.porosity === request?.porosity)
    .sort((a, b) => a.temperature_C - b.temperature_C)
    .map((point) => ({ ...point, temperature_K: celsiusToKelvin(point.temperature_C) }));

  return (
    <Stack spacing={2}>
      {heading}
      <Stack
        component="form"
        spacing={2}
        onSubmit={(event) => {
          event.preventDefault();
          calculate();
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TemperatureSweepFields value={sweep} onChange={setSweep} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1}>
              <NumberField
                label="Porosity P"
                value={porosity}
                onChange={setPorosity}
                min={RAW_MATERIALS_UI.porosityMin}
                max={RAW_MATERIALS_UI.porosityMax}
                step={RAW_MATERIALS_UI.porosityStep}
                helperText={`Volume fraction, 0–${RAW_MATERIALS_UI.porosityMax}`}
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={includeDense} onChange={(event) => setIncludeDense(event.target.checked)} />}
                label={`Also show dense (P = ${RAW_MATERIALS_UI.densePorosity})`}
              />
            </Stack>
          </Grid>
        </Grid>
        {comparedEligible.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Compared mix materials included: {comparedEligible.map((entry) => entry.name).join(', ')}
          </Typography>
        )}
        {formError && <Alert severity="warning">{formError}</Alert>}
        <Box>
          <CalculateButton loading={result.isLoading} />
        </Box>
      </Stack>
      <ResultPanel loading={result.isLoading} error={result.error} hasResult={Boolean(request) && result.isComplete}>
        {request && (
          <Stack spacing={2}>
            {selected && <FiredBasis result={selected} />}
            {selected?.warnings.map((warning) => (
              <Alert key={warning} severity="warning">
                {warning}
              </Alert>
            ))}
            {request.temperatures_C.length === 1 ? (
              <Grid container spacing={2}>
                {selectedRows.slice(0, 1).flatMap((row) => [
                  <Grid key="lambda" size={{ xs: 6, md: 4 }}>
                    <ResultCard label="λ_eff" value={row.lambda_WmK} unit="W/(m·K)" />
                  </Grid>,
                  <Grid key="cp" size={{ xs: 6, md: 4 }}>
                    <ResultCard label="Cp" value={row.cp_JkgK} unit="J/(kg·K)" />
                  </Grid>,
                  <Grid key="rho" size={{ xs: 6, md: 4 }}>
                    <ResultCard label="ρ (bulk)" value={row.rho_kgm3} unit="kg/m³" hint={RAW_MATERIALS_UI.bulkDensityNote} />
                  </Grid>,
                  <Grid key="a" size={{ xs: 6, md: 4 }}>
                    <ResultCard label="a" value={row.diffusivity_m2s} unit="m²/s" />
                  </Grid>,
                ])}
              </Grid>
            ) : (
              <>
                <EffectiveConductivityChart
                  points={result.points}
                  names={names}
                  porosity={request.porosity}
                  includeDense={request.includeDense}
                />
                <SpecificHeatChart points={result.points} names={names} porosity={request.porosity} includeDense={false} />
                <Typography variant="body2">
                  {material.name} at P = {request.porosity}; {RAW_MATERIALS_UI.bulkDensityNote}.
                </Typography>
                <ResultTable columns={COLUMNS} rows={selectedRows} rowKey={(row) => String(row.temperature_C)} />
              </>
            )}
          </Stack>
        )}
      </ResultPanel>
    </Stack>
  );
}
