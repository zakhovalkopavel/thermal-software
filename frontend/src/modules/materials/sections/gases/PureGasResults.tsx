import { useMemo } from 'react';
import { Alert, Stack } from '@mui/material';
import { ResultTable, apiErrorMessages } from '../../../../components/calc';
import type { ResultTableColumn } from '../../../../components/calc';
import { GasPropertyChart } from './charts/GasPropertyChart';
import { PURE_GAS_PROPERTIES } from './constants/pure-gas-properties.constants';
import type { GasPropertyKey } from './types/gas-property-key.type';
import type { PureGasPropertyRow } from './types/pure-gas-property-row.type';
import type { PureGasResultsProps } from './types/pure-gas-results-props.type';

const CHART_KEYS: GasPropertyKey[] = ['Cp_J_kgK', 'mu_Pa_s', 'nu_m2s', 'rho_kg_m3', 'lambda_WmK', 'Pr'];

export function PureGasResults({ request, rows, gasList }: PureGasResultsProps) {
  const nameOf = (key: string) => gasList.find((gas) => gas.key === key)?.name ?? key;

  const problems = useMemo(() => {
    const byGas = new Map<string, Set<string>>();
    for (const row of rows) {
      for (const error of row.errors) {
        const set = byGas.get(row.gas) ?? new Set<string>();
        apiErrorMessages(error).messages.forEach((message) => set.add(message));
        byGas.set(row.gas, set);
      }
    }
    return [...byGas.entries()];
  }, [rows]);

  const groups = useMemo(
    () =>
      request.gases.map((gas) => ({
        name: gasList.find((entry) => entry.key === gas)?.name ?? gas,
        rows: rows.filter((row) => row.gas === gas),
      })),
    [request.gases, rows, gasList],
  );

  const warnings = problems.length > 0 && (
    <Alert severity="warning">
      Some properties could not be calculated:
      {problems.map(([gas, messages]) => (
        <div key={gas}>
          <b>{nameOf(gas)}</b>: {[...messages].join('; ')}
        </div>
      ))}
    </Alert>
  );

  if (request.mode === 'single') {
    type PropertyRow = { label: string; unit: string } & Record<string, number | string | undefined>;
    const propertyRows: PropertyRow[] = PURE_GAS_PROPERTIES.map((property) => ({
      label: property.label,
      unit: property.unit,
      ...Object.fromEntries(rows.map((row) => [row.gas, row[property.key]])),
    }));
    const columns: ResultTableColumn<PropertyRow>[] = [
      { key: 'label', label: 'Property', align: 'left' },
      { key: 'unit', label: 'Unit', align: 'left' },
      ...request.gases.map((gas) => ({ key: gas, label: nameOf(gas) })),
    ];
    return (
      <Stack spacing={2}>
        {warnings}
        <ResultTable columns={columns} rows={propertyRows} rowKey={(row) => row.label} />
      </Stack>
    );
  }

  const columns: ResultTableColumn<PureGasPropertyRow>[] = [
    { key: 'gas', label: 'Gas', align: 'left', render: (row) => nameOf(row.gas) },
    { key: 'T_K', label: 'T', unit: 'K' },
    ...PURE_GAS_PROPERTIES.map((property) => ({ key: property.key, label: property.label, unit: property.unit })),
  ];

  return (
    <Stack spacing={2}>
      {warnings}
      <GasPropertyChart groups={groups} availableKeys={CHART_KEYS} />
      <ResultTable columns={columns} rows={rows} rowKey={(row) => `${row.gas}:${row.T_K}`} />
    </Stack>
  );
}
