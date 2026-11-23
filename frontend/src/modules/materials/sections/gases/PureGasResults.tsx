import { useMemo } from 'react';
import { Alert, Stack } from '@mui/material';
import { ResultTable, apiErrorMessages } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { GasPropertyChart } from './charts/GasPropertyChart';
import { gasChartPresentKeys } from './mappers/gas-chart-present-keys.mapper';
import { PURE_GAS_PROPERTIES } from './constants/pure-gas-properties.constants';
import type { PureGasPropertyRow } from './types/pure-gas-property-row.type';
import type { PureGasResultsProps } from './types/pure-gas-results-props.type';
import type { PureGasSpeciesRef } from './types/pure-gas-species-ref.type';

function speciesId(gas: PureGasSpeciesRef): string {
  return gas.source === 'registry' ? gas.key : gas.id;
}

type SweepRow = PureGasPropertyRow & { T_C: number };

export function PureGasResults({ request, rows, gasList, temperatureUnit }: PureGasResultsProps) {
  const nameOf = (id: string) => {
    const fromRequest = request.gases.find((gas) => speciesId(gas) === id)?.label;
    if (fromRequest) return fromRequest;
    return gasList.find((gas) => gas.key === id)?.name ?? id;
  };

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
      request.gases.map((gas) => {
        const id = speciesId(gas);
        return {
          name: nameOf(id),
          rows: rows.filter((row) => row.gas === id),
        };
      }),
    [request.gases, rows, gasList],
  );

  const availableKeys = useMemo(() => gasChartPresentKeys(rows), [rows]);

  const sweepRows: SweepRow[] = useMemo(
    () => rows.map((row) => ({ ...row, T_C: kelvinToCelsius(row.T_K) })),
    [rows],
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
      ...request.gases.map((gas) => {
        const id = speciesId(gas);
        return { key: id, label: nameOf(id) };
      }),
    ];
    return (
      <Stack spacing={2}>
        {warnings}
        <ResultTable columns={columns} rows={propertyRows} rowKey={(row) => row.label} />
      </Stack>
    );
  }

  const tColumns: ResultTableColumn<SweepRow>[] =
    temperatureUnit === 'C'
      ? [
          { key: 'T_C', label: 'T', unit: '°C' },
          { key: 'T_K', label: 'T', unit: 'K' },
        ]
      : [
          { key: 'T_K', label: 'T', unit: 'K' },
          { key: 'T_C', label: 'T', unit: '°C' },
        ];

  const columns: ResultTableColumn<SweepRow>[] = [
    { key: 'gas', label: 'Gas', align: 'left', render: (row) => nameOf(row.gas) },
    ...tColumns,
    ...PURE_GAS_PROPERTIES.map((property) => ({ key: property.key, label: property.label, unit: property.unit })),
  ];

  return (
    <Stack spacing={2}>
      {warnings}
      {availableKeys.length > 0 && (
        <GasPropertyChart groups={groups} availableKeys={availableKeys} temperatureUnit={temperatureUnit} />
      )}
      <ResultTable columns={columns} rows={sweepRows} rowKey={(row) => `${row.gas}:${row.T_K}`} />
    </Stack>
  );
}
