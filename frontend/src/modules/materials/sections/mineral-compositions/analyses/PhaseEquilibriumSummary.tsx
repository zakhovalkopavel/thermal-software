import { Alert, Box, Grid, Stack, Typography } from '@mui/material';
import { ResultCard, formatValue } from '@/shared/ui/calc';
import { LiquidSolidPieChart } from '../charts/LiquidSolidPieChart';
import { PhaseCompositionChart } from '../charts/PhaseCompositionChart';
import { PHASE_EQUILIBRIUM_UI } from '../constants/phase-equilibrium-ui.constants';
import { formatGlassPoints } from '../mappers/format-glass-points.mapper';
import { formatMeltViscosity } from '../mappers/format-melt-viscosity.mapper';
import { formatOxideComposition } from '../mappers/format-oxide-composition.mapper';
import { matrixLiquidViscosity } from '../mappers/matrix-liquid-viscosity.mapper';
import type { PhaseResultProps } from '../types/phase-result-props.type';

const {
  empty: EMPTY,
  liquidTitle,
  unreactedGlassTitle,
  unreactedGlassHint,
  quenchedGlassTitle,
  crystalsTitle,
} = PHASE_EQUILIBRIUM_UI;

export function PhaseEquilibriumSummary({ result }: PhaseResultProps) {
  const { atTemperature, afterCooling, matrix, metadata } = result;
  const { comparison } = metadata;
  const { liquid, glass, crystals } = atTemperature;
  const viscosity = matrixLiquidViscosity(liquid);
  const glassParts = glass.parts?.filter((part) => part.percent > 0) ?? [];
  const quenchedMatrix = afterCooling.glass.parts?.find((part) => part.source === 'matrix');
  const crystalLine = crystals.map((crystal) => `${crystal.phase} ${formatValue(crystal.percent)} %`).join(', ');

  return (
    <Stack spacing={1.5}>
      {result.warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      <Typography variant="body2" color="text.secondary">
        Solidus {matrix.solidus_C} °C · liquidus {matrix.liquidus_C} °C · method {metadata.method ?? EMPTY} · confidence{' '}
        {metadata.confidence ?? EMPTY} · hold {metadata.holdTime_hours} h · reacted matrix {formatValue(metadata.reactedPercent)} %
      </Typography>

      <Box>
        <Typography variant="subtitle2">{liquidTitle}</Typography>
        <Typography variant="body2">
          {formatValue(liquid.percent)} % ({formatValue(liquid.mass)} kg)
        </Typography>
        {liquid.percent > 0 && (
          <>
            <Typography variant="body2">Viscosity: {formatMeltViscosity(viscosity)}</Typography>
            <Typography variant="body2">Composition (wt%): {formatOxideComposition(liquid.composition)}</Typography>
          </>
        )}
      </Box>

      {glass.percent > 0 && (
        <Box>
          <Typography variant="subtitle2">{unreactedGlassTitle}</Typography>
          <Alert severity="info" sx={{ py: 0.5, mb: 0.5 }}>
            {unreactedGlassHint}
          </Alert>
          <Typography variant="body2">
            Total {formatValue(glass.percent)} % ({formatValue(glass.mass)} kg) · composition (wt%):{' '}
            {formatOxideComposition(glass.composition)}
          </Typography>
          {glassParts.map((part) => (
            <Box key={`${part.materialId ?? part.name}-${part.percent}`} sx={{ pl: 1 }}>
              <Typography variant="body2">
                {part.name}: {formatValue(part.percent)} %{part.state ? ` · ${part.state}` : ''}
              </Typography>
              <Typography variant="body2">Viscosity: {formatMeltViscosity(part.viscosity)}</Typography>
              <Typography variant="body2">Glass points: {formatGlassPoints(part.glassPoints)}</Typography>
              <Typography variant="body2">Composition (wt%): {formatOxideComposition(part.composition)}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {quenchedMatrix && quenchedMatrix.percent > 0 && (
        <Box>
          <Typography variant="subtitle2">{quenchedGlassTitle}</Typography>
          <Typography variant="body2">
            {formatValue(quenchedMatrix.percent)} % · glass points: {formatGlassPoints(quenchedMatrix.glassPoints)}
          </Typography>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2">{crystalsTitle}</Typography>
        <Typography variant="body2">{crystalLine || EMPTY}</Typography>
      </Box>

      {comparison && (
        <Stack spacing={1}>
          <Grid container spacing={1}>
            <Grid size={6}>
              <ResultCard label="CALPHAD liquid" value={comparison.calphadLiquidPercent} unit="% of matrix" />
            </Grid>
            <Grid size={6}>
              <ResultCard
                label={`Legacy liquid (${comparison.legacyVariant})`}
                value={comparison.legacyLiquidPercent ?? EMPTY}
                unit={comparison.legacyLiquidPercent === null ? undefined : '% of matrix'}
                hint={comparison.liquidPercentDelta === null ? undefined : `Δ ${formatValue(comparison.liquidPercentDelta)} pp vs CALPHAD`}
              />
            </Grid>
          </Grid>
          {comparison.legacyUnavailableReason && <Alert severity="info">{comparison.legacyUnavailableReason}</Alert>}
        </Stack>
      )}

      <LiquidSolidPieChart result={result} />
      <PhaseCompositionChart result={result} />
    </Stack>
  );
}
