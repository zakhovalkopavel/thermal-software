import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { formatValue } from '@/shared/ui/calc/formatters/format';
import type { ResultTableColumn } from '@/shared/ui/calc/types/result-table-column.type';

type ResultTableProps<T> = {
  columns: ReadonlyArray<ResultTableColumn<T>>;
  rows: ReadonlyArray<T>;
  maxHeight?: number;
  rowKey?: (row: T, index: number) => string;
};

function cellValue<T>(row: T, column: ResultTableColumn<T>): ReactNode {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  if (typeof value === 'number') return formatValue(value, column.digits ?? 4);
  if (value === null || value === undefined) return '—';
  return String(value);
}

export function ResultTable<T>({ columns, rows, maxHeight = 420, rowKey }: ResultTableProps<T>) {
  return (
    <TableContainer sx={{ maxHeight, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align ?? 'right'} sx={{ fontWeight: 600 }}>
                {column.label}
                {column.unit ? `, ${column.unit}` : ''}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={rowKey ? rowKey(row, index) : index} hover>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align ?? 'right'}>
                  {cellValue(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
