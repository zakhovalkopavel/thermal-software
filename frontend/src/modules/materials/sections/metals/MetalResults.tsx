import { Alert, Grid, Stack, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ResultCard, ResultTable, formatValue } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { isEmissivityClamped } from '../../mappers/is-emissivity-clamped.mapper';
import {
  METAL_RESULT_PROPERTIES,
  metalResultHasValue,
  metalResultPresentProperties,
  metalResultValue,
} from './constants/metal-result-properties.constants';
import { MetalPropertiesChart } from './charts/MetalPropertiesChart';
import type { MetalResultsProps } from './types/metal-results-props.type';

type TableRow = { T_K: number } & Record<string, number>;

export function MetalResults({
  request,
  metals,
  byMaterial,
  temperatureUnit,
  skippedOutsideDomain = 0,
}: MetalResultsProps) {
  const graded = request.materials
    .map((materialId) => ({ metal: metals.find((item) => item.materialId === materialId), rows: byMaterial[materialId] ?? [] }))
    .filter((entry): entry is { metal: NonNullable<typeof entry.metal>; rows: typeof entry.rows } => Boolean(entry.metal));

  const omittedEmpty = graded.reduce(
    (count, { rows }) => count + rows.filter((row) => !metalResultHasValue(row)).length,
    0,
  );
  const clippedCount = skippedOutsideDomain + omittedEmpty;

  const donorNotes = [
    ...new Set(
      graded.flatMap(({ rows }) => rows.flatMap((row) => row.notes ?? []).filter((note) => !/omitted:/i.test(note))),
    ),
  ];

  if (request.mode === 'single') {
    return (
      <Stack spacing={2}>
        {graded.map(({ metal, rows }) => {
          const row = rows[0];
          if (!row || !metalResultHasValue(row)) {
            return (
              <Alert key={metal.materialId} severity="info">
                {metal.name}:{' '}
                {row?.notes?.find((note) => /outside table domain/i.test(note)) ??
                  'no table data at this temperature (outside this grade’s domains).'}
              </Alert>
            );
          }
          const cards = METAL_RESULT_PROPERTIES.filter(
            (property) => metalResultValue(row, property.key) !== undefined,
          );
          return (
            <Stack key={metal.materialId} spacing={1}>
              <Typography variant="subtitle1">
                {metal.name} at {formatValue(row.T_K)} K ({formatValue(kelvinToCelsius(row.T_K))} °C)
              </Typography>
              <Grid container spacing={2}>
                {cards.map((property) => {
                  const value = metalResultValue(row, property.key);
                  const clamped =
                    property.key === 'emissivity' && isEmissivityClamped(row.T_K, metal.emissivityRange_K);
                  return (
                    <Grid key={property.key} size={{ xs: 12, sm: 6, md: 4 }}>
                      <ResultCard
                        label={property.label}
                        value={value}
                        unit={property.unit}
                        hint={
                          clamped && metal.emissivityRange_K
                            ? `Clamped: T outside ${metal.emissivityRange_K.min}–${metal.emissivityRange_K.max} K`
                            : undefined
                        }
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          );
        })}
        {donorNotes.length > 0 && (
          <Alert severity="info">
            {donorNotes.map((note) => (
              <Typography key={note} variant="body2" component="div">
                {note}
              </Typography>
            ))}
          </Alert>
        )}
      </Stack>
    );
  }

  const presentByMaterial = graded.map(({ metal, rows }) => ({
    metal,
    rows,
    properties: metalResultPresentProperties(rows),
  }));

  const rows: TableRow[] = request.temperatures_K
    .map((T_K) => {
      const row: TableRow = { T_K, T_C: kelvinToCelsius(T_K) };
      for (const { metal, rows: results, properties } of presentByMaterial) {
        const result = results.find((item) => item.T_K === T_K);
        if (!result) continue;
        for (const property of properties) {
          const value = metalResultValue(result, property.key);
          if (value !== undefined) row[`${property.key}:${metal.materialId}`] = value;
        }
      }
      return row;
    })
    .filter((row) =>
      presentByMaterial.some(({ metal, properties }) =>
        properties.some((property) => row[`${property.key}:${metal.materialId}`] !== undefined),
      ),
    );

  const tColumns: ResultTableColumn<TableRow>[] =
    temperatureUnit === 'C'
      ? [
          { key: 'T_C', label: 'T', unit: '°C' },
          { key: 'T_K', label: 'T', unit: 'K' },
        ]
      : [
          { key: 'T_K', label: 'T', unit: 'K' },
          { key: 'T_C', label: 'T', unit: '°C' },
        ];

  const columns: ResultTableColumn<TableRow>[] = [
    ...tColumns,
    ...presentByMaterial.flatMap(({ metal, properties }) =>
      properties.map((property) => {
        const key = `${property.key}:${metal.materialId}`;
        if (property.key !== 'emissivity') {
          return { key, label: `${property.short} ${metal.name}`, unit: property.unit };
        }
        return {
          key,
          label: `${property.short} ${metal.name}`,
          unit: property.unit,
          render: (row: TableRow) => (
            <>
              {formatValue(row[key])}
              {isEmissivityClamped(row.T_K, metal.emissivityRange_K) && (
                <Tooltip title="Clamped: T outside the ε validity range">
                  <InfoOutlinedIcon fontSize="inherit" color="warning" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                </Tooltip>
              )}
            </>
          ),
        };
      }),
    ),
  ];

  const chartByMaterial = Object.fromEntries(
    Object.entries(byMaterial).map(([id, materialRows]) => [id, materialRows.filter(metalResultHasValue)]),
  );

  return (
    <Stack spacing={2}>
      {clippedCount > 0 && (
        <Alert severity="info">
          Showing only temperatures with at least one property inside each grade’s table domain (
          {clippedCount} empty point{clippedCount === 1 ? '' : 's'} omitted). Domains differ by property and
          grade.
        </Alert>
      )}
      {donorNotes.length > 0 && (
        <Alert severity="info">
          {donorNotes.map((note) => (
            <Typography key={note} variant="body2" component="div">
              {note}
            </Typography>
          ))}
        </Alert>
      )}
      {rows.length === 0 ? (
        <Alert severity="warning">No temperatures in the sweep fall inside the selected grades’ data domains.</Alert>
      ) : (
        <>
          <MetalPropertiesChart metals={metals} byMaterial={chartByMaterial} temperatureUnit={temperatureUnit} />
          <ResultTable columns={columns} rows={rows} rowKey={(row) => String(row.T_K)} />
        </>
      )}
    </Stack>
  );
}
