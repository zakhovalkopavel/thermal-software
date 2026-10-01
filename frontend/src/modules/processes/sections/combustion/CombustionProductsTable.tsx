import { useMemo } from 'react';
import { ResultTable, formatValue } from '@/shared/ui/calc';
import type { ResultTableColumn } from '@/shared/ui/calc';
import { COMBUSTION_UI } from './constants/combustion-ui.constants';
import { toProductRows } from './mappers/product-rows.mapper';
import type { CombustionProductsTableProps } from './types/combustion-products-table-props.type';
import type { ProductRow } from './types/product-row.type';

const PERCENT = 100;

export function CombustionProductsTable({ steps }: CombustionProductsTableProps) {
  const rows = useMemo(() => toProductRows(steps), [steps]);
  const columns = useMemo<ResultTableColumn<ProductRow>[]>(
    () => [
      { key: 'species', label: 'Species', align: 'left' },
      ...steps.flatMap((step): ResultTableColumn<ProductRow>[] => [
        {
          key: `${step.key}-mole`,
          label: `${step.label}, mol`,
          unit: '%',
          render: (row) => formatValue(row.values[step.key].moleFraction * PERCENT, COMBUSTION_UI.fractionDigits),
        },
        {
          key: `${step.key}-mass`,
          label: `${step.label}, mass flow`,
          unit: 'kg/s',
          render: (row) => formatValue(row.values[step.key].massFlow_kgs, COMBUSTION_UI.fractionDigits),
        },
      ]),
    ],
    [steps],
  );
  return <ResultTable columns={columns} rows={rows} rowKey={(row) => row.species} />;
}
