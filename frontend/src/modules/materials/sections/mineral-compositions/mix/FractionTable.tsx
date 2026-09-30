import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { NumberField, formatValue } from '../../../../../components/calc';
import { MaterialPicker } from '../../../components/MaterialPicker';
import { useParticleSizes } from '../../../hooks/useParticleSizes';
import type { MaterialPickerKind } from '../../../types/material-picker-kind.type';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { useMix } from '../hooks/useMix';
import { toSizeOptions } from '../mappers/size-options.mapper';
import type { MixFraction } from '../types/mix-fraction.type';
import { SizeFractionSelect } from './SizeFractionSelect';

const MIX_KINDS: MaterialPickerKind[] = ['mix-component'];

export function FractionTable() {
  const { state, dispatch, components, massPercentSum } = useMix();
  const sizes = useParticleSizes();
  const sumOff =
    Math.abs(massPercentSum - MINERAL_COMPOSITIONS_UI.massPercentTotal) > MINERAL_COMPOSITIONS_UI.massPercentTolerance;

  const update = (id: string, patch: Partial<Omit<MixFraction, 'id'>>) => dispatch({ type: 'update', id, patch });
  const densityOutOfRange = (density: number | null) =>
    density !== null && (density < MINERAL_COMPOSITIONS_UI.densityMin_kgm3 || density > MINERAL_COMPOSITIONS_UI.densityMax_kgm3);

  return (
    <Stack spacing={1}>
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 220 }}>Material</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Size fraction</TableCell>
              <TableCell>dMin–dMax / d50, mm</TableCell>
              <TableCell sx={{ width: 110 }}>Mass, %</TableCell>
              <TableCell sx={{ width: 130 }}>ρ, kg/m³</TableCell>
              <TableCell align="center">Fixed</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {state.fractions.map((fraction) => {
              const entry = fraction.materialId ? components.get(fraction.materialId) : undefined;
              const custom = fraction.sizeKey === MINERAL_COMPOSITIONS_UI.customSizeKey;
              return (
                <TableRow key={fraction.id}>
                  <TableCell>
                    <MaterialPicker
                      kinds={MIX_KINDS}
                      size="small"
                      label="Material"
                      value={fraction.materialId ? { kind: 'mix-component', materialId: fraction.materialId } : null}
                      onChange={(selection) => {
                        const next = selection ? components.get(selection.materialId) : undefined;
                        update(fraction.id, {
                          materialId: selection?.materialId ?? null,
                          density_kgm3: next?.rho_true_after_firing_kgm3 ?? null,
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <SizeFractionSelect
                      options={toSizeOptions(sizes.data, entry?.availableParticleSizes)}
                      value={fraction.sizeKey}
                      disabled={!fraction.materialId}
                      onChange={(sizeKey, range) =>
                        update(
                          fraction.id,
                          range
                            ? { sizeKey, dMin_mm: range.dMin_mm, dMax_mm: range.dMax_mm, d50_mm: range.d50_mm }
                            : { sizeKey },
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {custom ? (
                      <Stack direction="row" spacing={0.5} sx={{ minWidth: 240 }}>
                        <NumberField label="dMin" value={fraction.dMin_mm} onChange={(dMin_mm) => update(fraction.id, { dMin_mm })} min={0} />
                        <NumberField label="dMax" value={fraction.dMax_mm} onChange={(dMax_mm) => update(fraction.id, { dMax_mm })} min={0} />
                        <NumberField label="d50" value={fraction.d50_mm} onChange={(d50_mm) => update(fraction.id, { d50_mm })} min={0} />
                      </Stack>
                    ) : fraction.dMin_mm !== null && fraction.dMax_mm !== null ? (
                      <Typography variant="body2">
                        {formatValue(fraction.dMin_mm)}–{formatValue(fraction.dMax_mm)} / {formatValue(fraction.d50_mm)}
                      </Typography>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <NumberField
                      value={fraction.massPercent}
                      onChange={(massPercent) => update(fraction.id, { massPercent })}
                      min={0}
                      max={MINERAL_COMPOSITIONS_UI.massPercentTotal}
                    />
                  </TableCell>
                  <TableCell>
                    <NumberField
                      value={fraction.density_kgm3}
                      onChange={(density_kgm3) => update(fraction.id, { density_kgm3 })}
                      min={0}
                      error={densityOutOfRange(fraction.density_kgm3)}
                      helperText={
                        densityOutOfRange(fraction.density_kgm3)
                          ? `Optimiser limit ${MINERAL_COMPOSITIONS_UI.densityMin_kgm3}–${MINERAL_COMPOSITIONS_UI.densityMax_kgm3}`
                          : undefined
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox size="small" checked={fraction.isFixed} onChange={(event) => update(fraction.id, { isFixed: event.target.checked })} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Remove fraction">
                      <IconButton size="small" onClick={() => dispatch({ type: 'remove', id: fraction.id })}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => dispatch({ type: 'add' })}>
          Add fraction
        </Button>
        <Typography variant="body2" color={sumOff ? 'warning.main' : 'text.secondary'}>
          Σ = {formatValue(massPercentSum)} %{sumOff && ' — must be 100'}
        </Typography>
        <Button size="small" onClick={() => dispatch({ type: 'normalize' })} disabled={massPercentSum <= 0}>
          Normalize
        </Button>
        <Box sx={{ flexGrow: 1 }} />
      </Stack>
    </Stack>
  );
}
