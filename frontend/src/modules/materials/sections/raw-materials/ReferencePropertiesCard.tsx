import { Chip, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { formatValue } from '../../../../components/calc';
import { toReferencePropertyRows } from './mappers/reference-property-rows.mapper';
import type { ReferencePropertiesCardProps } from './types/reference-properties-card-props.type';

export function ReferencePropertiesCard({ material }: ReferencePropertiesCardProps) {
  const rows = toReferencePropertyRows(material);
  const sizes = material.availableParticleSizes ?? [];
  const range = material.particleSize;

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1">Library reference values (room temperature unless stated)</Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No reference values stored.</Typography>
      ) : (
        <Table size="small">
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.label}</TableCell>
                <TableCell align="right">
                  {formatValue(row.value, row.digits)}
                  {row.unit && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                      {row.unit}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {(sizes.length > 0 || range) && (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Particle sizes</Typography>
          {range && (
            <Typography variant="body2">
              d = {formatValue(range.dMin_mm)}–{formatValue(range.dMax_mm)} mm, d50 = {formatValue(range.d50_mm)} mm
            </Typography>
          )}
          {sizes.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {sizes.map((code) => (
                <Chip key={code} size="small" variant="outlined" label={code} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
