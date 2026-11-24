import { useMemo } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import { ResultCard, ResultTable } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { GasMixturePieChart } from './charts/GasMixturePieChart';
import { GasPropertyChart } from './charts/GasPropertyChart';
import { gasChartPresentKeys } from './mappers/gas-chart-present-keys.mapper';
import type { GasMixtureResultsProps } from './types/gas-mixture-results-props.type';
import type { GasMixtureRow } from './types/gas-mixture-row.type';
import type { GasPropertyKey } from './types/gas-property-key.type';

type ChartRow = { T_K: number } & Partial<Record<GasPropertyKey, number>>;
type SweepRow = GasMixtureRow & { T_C: number; nu_m2s?: number };

const MIXTURE_PROPERTY_COLUMNS: ResultTableColumn<SweepRow>[] = [
  { key: 'Cp_J_kgK', label: 'Cp', unit: 'J/(kg·K)' },
  { key: 'H_J_mol', label: 'H', unit: 'J/mol' },
  { key: 'rho_kg_m3', label: 'ρ', unit: 'kg/m³' },
  { key: 'molecularWeight_kg_mol', label: 'M', unit: 'kg/mol' },
  { key: 'mu_Pa_s', label: 'μ', unit: 'Pa·s' },
  { key: 'nu_m2s', label: 'ν', unit: 'm²/s' },
  { key: 'lambda', label: 'λ', unit: 'W/(m·K)' },
  { key: 'Pr', label: 'Pr' },
];

function toChartRow(row: GasMixtureRow): ChartRow {
  return {
    T_K: row.T_K,
    Cp_J_kgK: row.Cp_J_kgK,
    H_J_mol: row.H_J_mol,
    mu_Pa_s: row.mu_Pa_s,
    nu_m2s: row.rho_kg_m3 > 0 ? row.mu_Pa_s / row.rho_kg_m3 : undefined,
    rho_kg_m3: row.rho_kg_m3,
    lambda_WmK: row.lambda,
    Pr: row.Pr,
  };
}

export function GasMixtureResults({ request, rows, temperatureUnit }: GasMixtureResultsProps) {
  const sweepRows: SweepRow[] = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        T_C: kelvinToCelsius(row.T_K),
        nu_m2s: row.rho_kg_m3 > 0 ? row.mu_Pa_s / row.rho_kg_m3 : undefined,
      })),
    [rows],
  );

  const groups = useMemo(
    () => [
      {
        name: 'Mixture',
        rows: rows.map(toChartRow),
      },
    ],
    [rows],
  );

  const availableKeys = useMemo(() => gasChartPresentKeys(groups[0]?.rows ?? []), [groups]);

  const species = Object.keys(rows[0]?.diffusion ?? {});
  type DiffusionRow = { T_K: number; T_C: number } & Record<string, number>;
  const diffusionRows: DiffusionRow[] = rows.map((row) => ({
    T_K: row.T_K,
    T_C: kelvinToCelsius(row.T_K),
    ...row.diffusion,
  }));
  const tColumns: ResultTableColumn<{ T_K: number; T_C: number }>[] =
    temperatureUnit === 'C'
      ? [
          { key: 'T_C', label: 'T', unit: '°C' },
          { key: 'T_K', label: 'T', unit: 'K' },
        ]
      : [
          { key: 'T_K', label: 'T', unit: 'K' },
          { key: 'T_C', label: 'T', unit: '°C' },
        ];
  const diffusionColumns: ResultTableColumn<DiffusionRow>[] = [
    ...tColumns,
    ...species.map((key) => ({ key, label: `D ${key}`, unit: 'm²/s' })),
  ];

  const single = request.mode === 'single' ? sweepRows[0] : undefined;

  const tableColumns: ResultTableColumn<SweepRow>[] = [...tColumns, ...MIXTURE_PROPERTY_COLUMNS];

  return (
    <Stack spacing={2}>
      <GasMixturePieChart composition={request.composition} fractionType={request.fractionType} />
      {single ? (
        <Grid container spacing={2}>
          {MIXTURE_PROPERTY_COLUMNS.map((column) => (
            <Grid key={column.key} size={{ xs: 6, sm: 4, md: 3 }}>
              <ResultCard
                label={column.label}
                value={single[column.key as keyof SweepRow] as number | undefined}
                unit={column.unit}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {availableKeys.length > 0 && (
            <GasPropertyChart groups={groups} availableKeys={availableKeys} temperatureUnit={temperatureUnit} />
          )}
          <ResultTable columns={tableColumns} rows={sweepRows} rowKey={(row) => String(row.T_K)} />
        </>
      )}
      {species.length > 0 && (
        <>
          <Typography variant="subtitle2">Effective diffusion coefficients in the mixture</Typography>
          <ResultTable columns={diffusionColumns} rows={diffusionRows} rowKey={(row) => String(row.T_K)} />
        </>
      )}
    </Stack>
  );
}
