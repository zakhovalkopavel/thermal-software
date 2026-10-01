import { useMemo, useState } from 'react';
import { Alert, Box, Checkbox, CircularProgress, FormControlLabel, Grid, Stack, Typography } from '@mui/material';
import {
  CalculateButton,
  JsonErrorAlert,
  NumberField,
  REFRACTORY_OXIDES,
  ResultCard,
  ResultPanel,
  ResultTable,
  formatValue,
} from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import { TEMPERATURE_SWEEP } from '../../constants/temperature-sweep.constants';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { EffectiveConductivityChart } from './charts/EffectiveConductivityChart';
import { SpecificHeatChart } from './charts/SpecificHeatChart';
import { RAW_MATERIALS_UI } from './constants/raw-materials-ui.constants';
import { useRawMaterialThermal } from './hooks/useRawMaterialThermal';
import { useSingleMaterialComposition } from './hooks/useSingleMaterialComposition';
import { toCompositionCoverage } from './mappers/composition-coverage.mapper';
import type { CalculatedThermalCardProps } from './types/calculated-thermal-card-props.type';
import type { RawMaterialThermalPoint } from './types/raw-material-thermal-point.type';
import type { RawMaterialThermalRequest } from './types/raw-material-thermal-request.type';

type TableRow = RawMaterialThermalPoint & { temperature_K: number };

const COLUMNS: ResultTableColumn<TableRow>[] = [
  { key: 'temperature_C', label: 'T', unit: '°C' },
  { key: 'temperature_K', label: 'T', unit: 'K' },
  { key: 'lambda_WmK', label: 'λ_eff', unit: 'W/(m·K)' },
  { key: 'cp_JkgK', label: 'Cp', unit: 'J/(kg·K)' },
  { key: 'rho_kgm3', label: 'ρ (model value)', unit: 'kg/m³' },
  { key: 'diffusivity_m2s', label: 'a (model value)', unit: 'm²/s' },
];

const toCelsius = (T_K: number) =>
  Number((T_K - TEMPERATURE_SWEEP.KELVIN_OFFSET).toFixed(RAW_MATERIALS_UI.temperatureDecimals));

export function CalculatedThermalCard({ material, eligible, comparedEligible }: CalculatedThermalCardProps) {
  const composition = useSingleMaterialComposition(material.materialId, eligible);
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

  const heading = <Typography variant="subtitle1">Calculated vs temperature (mix components)</Typography>;

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
  if (composition.isLoading) {
    return (
      <Stack spacing={1}>
        {heading}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Stack>
    );
  }
  if (!composition.data) {
    return (
      <Stack spacing={1}>
        {heading}
        <JsonErrorAlert error={composition.error} />
      </Stack>
    );
  }

  const fired = composition.data;
  if (Object.keys(fired.acceptedOxides_normalized).length === 0) {
    return (
      <Stack spacing={1}>
        {heading}
        <Alert severity="info">
          The fired composition of {material.name} contains none of the modelled oxides ({REFRACTORY_OXIDES.join(', ')}),
          so the calculated block is not available.
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

  const skipped = (request?.materialIds ?? []).filter((id) => {
    const normalized = result.compositions[id]?.acceptedOxides_normalized;
    return normalized && Object.keys(normalized).length === 0;
  });
  const selectedRows: TableRow[] = result.points
    .filter((point) => point.materialId === material.materialId && point.porosity === request?.porosity)
    .sort((a, b) => a.temperature_C - b.temperature_C)
    .map((point) => ({ ...point, temperature_K: point.temperature_C + TEMPERATURE_SWEEP.KELVIN_OFFSET }));

  return (
    <Stack spacing={2}>
      {heading}
      <Typography variant="body2">
        Fired basis: loss on ignition {formatValue(fired.lossOnIgnition_wt)} wt%; coverage by modelled oxides{' '}
        <b>{formatValue(toCompositionCoverage(fired), RAW_MATERIALS_UI.coverageDigits)} %</b> of the fired mass.
      </Typography>
      {fired.warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}
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
                helperText="Volume fraction, 0–1"
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
            {skipped.length > 0 && (
              <Alert severity="info">No modelled oxide, not calculated: {skipped.map((id) => names[id] ?? id).join(', ')}</Alert>
            )}
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
                    <ResultCard label="ρ (model value)" value={row.rho_kgm3} unit="kg/m³" hint={RAW_MATERIALS_UI.modelDensityNote} />
                  </Grid>,
                  <Grid key="a" size={{ xs: 6, md: 4 }}>
                    <ResultCard label="a (model value)" value={row.diffusivity_m2s} unit="m²/s" />
                  </Grid>,
                ])}
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="True density (library)" value={material.rho_true_after_firing_kgm3} unit="kg/m³" />
                </Grid>
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
                  {material.name} at P = {request.porosity}. ρ and a are model values ({RAW_MATERIALS_UI.modelDensityNote}); library true
                  density after firing: <b>{formatValue(material.rho_true_after_firing_kgm3)} kg/m³</b>.
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
