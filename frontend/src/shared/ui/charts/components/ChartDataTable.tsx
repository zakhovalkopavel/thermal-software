import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { formatValue } from '@/shared/ui/calc/formatters/format';
import type { ChartTableData } from '@/shared/ui/charts/types/chart-table-data.type';

type ChartDataTableProps = {
  table: ChartTableData;
};

export function ChartDataTable({ table }: ChartDataTableProps) {
  return (
    <TableContainer sx={{ maxHeight: 360, mt: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {table.columns.map((column, index) => (
              <TableCell key={index} align={index === 0 ? 'left' : 'right'} sx={{ fontWeight: 600 }}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {table.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {row.map((cell, index) => (
                <TableCell key={index} align={index === 0 ? 'left' : 'right'}>
                  {typeof cell === 'number' || cell === null ? formatValue(cell) : cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
