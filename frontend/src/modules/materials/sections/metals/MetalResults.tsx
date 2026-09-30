import { Grid, Stack, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ResultCard, ResultTable, formatValue } from '../../../../components/calc';
import type { ResultTableColumn } from '../../../../components/calc';
import { TEMPERATURE_SWEEP } from '../../constants/temperature-sweep.constants';
import { isEmissivityClamped } from '../../mappers/is-emissivity-clamped.mapper';
import { MetalPropertiesChart } from './charts/MetalPropertiesChart';
import type { MetalResultsProps } from './types/metal-results-props.type';

type TableRow = { T_K: number } & Record<string, number>;

export function MetalResults({ request, metals, byMaterial }: MetalResultsProps) {
  const graded = request.materials
    .map((materialId) => ({ metal: metals.find((item) => item.materialId === materialId), rows: byMaterial[materialId] ?? [] }))
    .filter((entry): entry is { metal: NonNullable<typeof entry.metal>; rows: typeof entry.rows } => Boolean(entry.metal));

  if (request.mode === 'single') {
    return (
      <Stack spacing={2}>
        {graded.map(({ metal, rows }) => {
          const row = rows[0];
          if (!row) return null;
          const clamped = isEmissivityClamped(row.T_K, metal.emissivityRange_K);
          return (
            <Stack key={metal.materialId} spacing={1}>
              <Typography variant="subtitle1">
                {metal.name} at {formatValue(row.T_K)} K ({formatValue(row.T_K - TEMPERATURE_SWEEP.KELVIN_OFFSET)} °C)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <ResultCard label="Thermal conductivity λ" value={row.lambda_WmK} unit="W/(m·K)" />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <ResultCard
                    label="Emissivity ε"
                    value={row.emissivity}
                    hint={
                      clamped
                        ? `Clamped: T outside ${metal.emissivityRange_K.min}–${metal.emissivityRange_K.max} K`
                        : undefined
                    }
                  />
                </Grid>
              </Grid>
            </Stack>
          );
        })}
      </Stack>
    );
  }

  const rows: TableRow[] = request.temperatures_K.map((T_K) => {
    const row: TableRow = { T_K, T_C: T_K - TEMPERATURE_SWEEP.KELVIN_OFFSET };
    for (const { metal, rows: results } of graded) {
      const result = results.find((item) => item.T_K === T_K);
      if (result) {
        row[`lambda:${metal.materialId}`] = result.lambda_WmK;
        row[`eps:${metal.materialId}`] = result.emissivity;
      }
    }
    return row;
  });

  const columns: ResultTableColumn<TableRow>[] = [
    { key: 'T_K', label: 'T', unit: 'K' },
    { key: 'T_C', label: 'T', unit: '°C' },
    ...graded.flatMap(({ metal }) => [
      { key: `lambda:${metal.materialId}`, label: `λ ${metal.name}`, unit: 'W/(m·K)' },
      {
        key: `eps:${metal.materialId}`,
        label: `ε ${metal.name}`,
        render: (row: TableRow) => (
          <>
            {formatValue(row[`eps:${metal.materialId}`])}
            {isEmissivityClamped(row.T_K, metal.emissivityRange_K) && (
              <Tooltip title="Clamped: T outside the ε validity range">
                <InfoOutlinedIcon fontSize="inherit" color="warning" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
              </Tooltip>
            )}
          </>
        ),
      },
    ]),
  ];

  return (
    <Stack spacing={2}>
      <MetalPropertiesChart metals={metals} byMaterial={byMaterial} />
      <ResultTable columns={columns} rows={rows} rowKey={(row) => String(row.T_K)} />
    </Stack>
  );
}
