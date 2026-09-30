import { useMemo } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import { ResultCard, ResultTable } from '../../../../components/calc';
import type { ResultTableColumn } from '../../../../components/calc';
import { GasMixturePieChart } from './charts/GasMixturePieChart';
import { GasPropertyChart } from './charts/GasPropertyChart';
import type { GasMixtureResultsProps } from './types/gas-mixture-results-props.type';
import type { GasMixtureRow } from './types/gas-mixture-row.type';
import type { GasPropertyKey } from './types/gas-property-key.type';

const CHART_KEYS: GasPropertyKey[] = ['Cp_J_kgK', 'mu_Pa_s', 'rho_kg_m3', 'lambda_WmK', 'Pr'];

const COLUMNS: ResultTableColumn<GasMixtureRow>[] = [
  { key: 'T_K', label: 'T', unit: 'K' },
  { key: 'Cp_J_kgK', label: 'Cp', unit: 'J/(kg·K)' },
  { key: 'H_J_mol', label: 'H', unit: 'J/mol' },
  { key: 'rho_kg_m3', label: 'ρ', unit: 'kg/m³' },
  { key: 'molecularWeight_kg_mol', label: 'M', unit: 'kg/mol' },
  { key: 'mu_Pa_s', label: 'μ', unit: 'Pa·s' },
  { key: 'lambda', label: 'λ', unit: 'W/(m·K)' },
  { key: 'Pr', label: 'Pr' },
];

export function GasMixtureResults({ request, rows }: GasMixtureResultsProps) {
  const groups = useMemo(
    () => [
      {
        name: 'Mixture',
        rows: rows.map((row) => ({
          T_K: row.T_K,
          Cp_J_kgK: row.Cp_J_kgK,
          mu_Pa_s: row.mu_Pa_s,
          rho_kg_m3: row.rho_kg_m3,
          lambda_WmK: row.lambda,
          Pr: row.Pr,
        })),
      },
    ],
    [rows],
  );

  const species = Object.keys(rows[0]?.diffusion ?? {});
  type DiffusionRow = { T_K: number } & Record<string, number>;
  const diffusionRows: DiffusionRow[] = rows.map((row) => ({ T_K: row.T_K, ...row.diffusion }));
  const diffusionColumns: ResultTableColumn<DiffusionRow>[] = [
    { key: 'T_K', label: 'T', unit: 'K' },
    ...species.map((key) => ({ key, label: `D ${key}`, unit: 'm²/s' })),
  ];

  const single = request.mode === 'single' ? rows[0] : undefined;

  return (
    <Stack spacing={2}>
      <GasMixturePieChart composition={request.composition} fractionType={request.fractionType} />
      {single ? (
        <Grid container spacing={2}>
          {COLUMNS.filter((column) => column.key !== 'T_K').map((column) => (
            <Grid key={column.key} size={{ xs: 6, sm: 4, md: 3 }}>
              <ResultCard
                label={column.label}
                value={single[column.key as keyof GasMixtureRow] as number}
                unit={column.unit}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <GasPropertyChart groups={groups} availableKeys={CHART_KEYS} />
          <ResultTable columns={COLUMNS} rows={rows} rowKey={(row) => String(row.T_K)} />
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
