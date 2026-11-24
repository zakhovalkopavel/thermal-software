import { useMemo } from 'react';
import { Alert, Grid, Paper, Stack, Typography } from '@mui/material';
import { ResultCard, ResultTable, formatValue } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { CompositionCompareChart } from './charts/CompositionCompareChart';
import { FixedPointsChart } from './charts/FixedPointsChart';
import { ViscosityCurveChart } from './charts/ViscosityCurveChart';
import { GLASS_MODELS } from './constants/glass-models.constants';
import { VISCOSITY_LEVELS } from './constants/viscosity-levels.constants';
import { isModelSwapped } from './mappers/is-model-swapped.mapper';
import type { GlassCurve } from './types/glass-curve.type';
import type { GlassResultsProps } from './types/glass-results-props.type';
import type { GlassViscosityPoint } from './types/glass-viscosity-point.type';

const USER_GLASS = 'Your glass';
const LOG_DIGITS = 3;

type FixedPointRow = { name: string } & Partial<Record<(typeof VISCOSITY_LEVELS)[number]['key'], number>>;
type CompositionRow = { oxide: string; wt?: number; mol?: number };

const PROFILE_COLUMNS: ResultTableColumn<GlassViscosityPoint>[] = [
  { key: 'temperature_C', label: 'T', unit: '°C' },
  { key: 'logViscosity', label: 'log₁₀η', digits: LOG_DIGITS },
  { key: 'eta', label: 'η', unit: 'Pa·s', render: (point) => formatValue(Math.pow(10, point.logViscosity)) },
];
const FIXED_POINT_COLUMNS: ResultTableColumn<FixedPointRow>[] = [
  { key: 'name', label: 'Glass', align: 'left' },
  ...VISCOSITY_LEVELS.map((level) => ({ key: level.key, label: level.label, unit: '°C' })),
];
const COMPOSITION_COLUMNS: ResultTableColumn<CompositionRow>[] = [
  { key: 'oxide', label: 'Oxide', align: 'left' },
  { key: 'wt', label: 'wt%' },
  { key: 'mol', label: 'mol%' },
];

export function GlassResults({ request, result, presetEntry }: GlassResultsProps) {
  const { userProfile } = result;
  const requestedLabel = GLASS_MODELS.find((model) => model.value === request.model)?.label;

  const curves = useMemo<GlassCurve[]>(
    () => [
      { key: 'user', name: USER_GLASS, isUser: true, profile: userProfile, swapped: isModelSwapped(request.model, userProfile?.model) },
      ...result.references.map((item) => ({
        key: item.reference.materialId,
        name: item.reference.name,
        isUser: false,
        profile: item.profile,
        error: item.error,
        swapped: isModelSwapped(request.model, item.profile?.model),
      })),
    ],
    [userProfile, result.references, request.model],
  );

  const failedReferences = curves.filter((curve) => curve.error).map((curve) => curve.name);
  const swapped = curves.filter((curve) => curve.swapped);

  const compositionGlasses = useMemo(() => {
    const own = request.unit === 'wt' ? result.wt : result.mol;
    return [
      ...(own ? [{ name: USER_GLASS, composition: own }] : []),
      ...result.references.flatMap((item) => {
        const composition = request.unit === 'wt' ? item.reference.composition : item.mol;
        return composition ? [{ name: item.reference.name, composition }] : [];
      }),
    ];
  }, [request.unit, result.wt, result.mol, result.references]);

  const fixedPointRows: FixedPointRow[] = curves.flatMap((curve) =>
    curve.profile?.fixedPoints
      ? [{ name: curve.name, ...Object.fromEntries(VISCOSITY_LEVELS.map((level) => [level.key, curve.profile?.fixedPoints?.[level.key]])) }]
      : [],
  );
  const compositionRows: CompositionRow[] = [...new Set([...Object.keys(result.wt ?? {}), ...Object.keys(result.mol ?? {})])]
    .map((oxide) => ({ oxide, wt: result.wt?.[oxide], mol: result.mol?.[oxide] }))
    .sort((a, b) => (b.wt ?? 0) - (a.wt ?? 0));

  const vtf = userProfile?.vtfParameters ?? result.atViscosity?.vtfParameters;
  const validation = userProfile?.validation;
  const grid = request.grid;

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Typography variant="body2">
          Model used: <b>{userProfile?.model ?? '—'}</b>
          {requestedLabel && ` (requested ${requestedLabel})`}
          {validation && ` · confidence ${validation.confidenceLevel} · extrapolation risk ${validation.extrapolationRisk}`}
        </Typography>
        {swapped.length > 0 && (
          <Alert severity="warning">
            {requestedLabel} is not valid for {swapped.map((curve) => curve.name).join(', ')}; the backend used another model
            (shown in the legend).
          </Alert>
        )}
        {validation?.warnings.map((warning) => (
          <Alert key={warning} severity="warning">
            {warning}
          </Alert>
        ))}
      </Stack>

      <ViscosityCurveChart
        curves={curves}
        xMin={grid[0]}
        xMax={grid[grid.length - 1]}
        userFixedPoints={userProfile?.fixedPoints}
        atTemperature={request.task === 'at-temperature' ? result.atTemperature : undefined}
        atViscosity={request.task === 'temperature-at-viscosity' ? result.atViscosity : undefined}
        subtitle={failedReferences.length > 0 ? `Reference not calculated: ${failedReferences.join(', ')}` : undefined}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <FixedPointsChart curves={curves} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CompositionCompareChart glasses={compositionGlasses} unit={request.unit} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {request.task === 'at-temperature' && result.atTemperature && (
          <>
            <Grid size={{ xs: 6, md: 3 }}>
              <ResultCard label={`η at ${formatValue(result.atTemperature.temperature_C)} °C`} value={Math.pow(10, result.atTemperature.logViscosity)} unit="Pa·s" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <ResultCard label="log₁₀η" value={result.atTemperature.logViscosity} digits={LOG_DIGITS} />
            </Grid>
          </>
        )}
        {request.task === 'temperature-at-viscosity' && result.atViscosity && (
          <Grid size={{ xs: 6, md: 3 }}>
            <ResultCard label={`T at log₁₀η = ${result.atViscosity.targetLogEta}`} value={result.atViscosity.temperature_C} unit="°C" />
          </Grid>
        )}
        {vtf && (
          <>
            <Grid size={{ xs: 4, md: 2 }}>
              <ResultCard label="VTF A" value={vtf.A} />
            </Grid>
            <Grid size={{ xs: 4, md: 2 }}>
              <ResultCard label="VTF B" value={vtf.B} unit="°C" />
            </Grid>
            <Grid size={{ xs: 4, md: 2 }}>
              <ResultCard label="VTF T0" value={vtf.T0} unit="°C" />
            </Grid>
          </>
        )}
      </Grid>

      {presetEntry && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2">Reference data — {presetEntry.name} (library)</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <ResultCard label="Density" value={presetEntry.rho_true_after_firing_kgm3} unit="kg/m³" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <ResultCard label="λ" value={presetEntry.thermalProperties?.thermalConductivity_WmK} unit="W/(m·K)" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <ResultCard label="Cp" value={presetEntry.thermalProperties?.specificHeat_JkgK} unit="J/(kg·K)" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <ResultCard label="α" value={presetEntry.thermalProperties?.thermalExpansion_perK} unit="1/K" digits={LOG_DIGITS} />
            </Grid>
          </Grid>
        </Paper>
      )}

      {fixedPointRows.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Fixed points</Typography>
          <ResultTable columns={FIXED_POINT_COLUMNS} rows={fixedPointRows} rowKey={(row) => row.name} />
        </Stack>
      )}
      {userProfile && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Profile — your glass</Typography>
          <ResultTable columns={PROFILE_COLUMNS} rows={userProfile.points} rowKey={(point) => String(point.temperature_C)} />
        </Stack>
      )}
      <Stack spacing={1}>
        <Typography variant="subtitle2">Composition calculated (normalised by the backend)</Typography>
        <ResultTable columns={COMPOSITION_COLUMNS} rows={compositionRows} rowKey={(row) => row.oxide} />
      </Stack>
    </Stack>
  );
}
